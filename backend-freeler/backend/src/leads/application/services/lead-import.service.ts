import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs, createReadStream } from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { parse } from 'fast-csv';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';
import { LeadEntity } from '../../infrastructure/entities/lead.entity';

type PendingImport = {
  filePath: string;
  originalName: string;
  uploadedAt: number;
  headers: string[];
};

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

type ImportJob = {
  importId: string;
  status: ImportJobStatus;
  total: number;
  processed: number;
  created: number;
  failed: number;
  errors: Array<{ row: number; issues: string[] }>;
  startedAt: number;
  finishedAt?: number;
};

type ParsedRow = Record<string, string>;

// Modelo m√≠nimo del archivo recibido desde Multer (evitamos depender del type completo)
export type ImportUploadedFile = {
  path: string;
  originalname: string;
};

const EXPECTED_FIELDS: Array<{ key: keyof LeadEntity; label: string; required?: boolean }> = [
  { key: 'nombres', label: 'Nombres', required: true },
  { key: 'apellidos', label: 'Apellidos' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Telefono', required: true },
  { key: 'dni', label: 'DNI' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'ocupacion', label: 'Ocupacion' },
  { key: 'descripcion', label: 'Descripcion' },
];

@Injectable()
export class LeadImportService {
  private readonly tmpDir = path.resolve(process.cwd(), 'tmp', 'lead-imports');
  private readonly pending = new Map<string, PendingImport>();
  private readonly jobs = new Map<string, ImportJob>();
  private readonly pendingTtlMs = 1000 * 60 * 60 * 24; // 24h de validez para archivos sin confirmar

  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepo: ILeadRepository,
  ) {
    void this.cleanupDanglingImports();
  }

  async preparePreview(file: ImportUploadedFile | undefined) {
    if (!file) {
      throw new BadRequestException('FILE_REQUIRED');
    }
    await this.cleanupDanglingImports();
    await fs.mkdir(this.tmpDir, { recursive: true });
    const extension = path.extname(file.originalname).toLowerCase();
    const importId = randomUUID();
    const destination = path.join(this.tmpDir, `${importId}${extension}`);
    await fs.rename(file.path, destination);

    const { headers, rows } = await this.parseFile(destination, {
      limit: 5,
    });
    if (!headers.length) {
      await this.safeCleanup(importId);
      throw new BadRequestException('EMPTY_FILE');
    }

    await this.persistPendingImport(importId, {
      filePath: destination,
      originalName: file.originalname,
      uploadedAt: Date.now(),
      headers,
    });

    const suggestedMapping = this.buildSuggestedMapping(headers);

    return {
      importId,
      headers,
      sampleRows: rows,
      suggestedMapping,
    };
  }

  startAsyncImport(params: {
    importId: string;
    mapping: Record<string, string>;
    usuarioEmpresaId: number;
    campaignId: number;
    actorLabel?: string;
  }) {
    const entryPromise = this.getPendingImport(params.importId);
    const jobSnapshot: ImportJob = {
      importId: params.importId,
      status: 'pending' as ImportJobStatus,
      total: 0,
      processed: 0,
      created: 0,
      failed: 0,
      errors: [] as Array<{ row: number; issues: string[] }>,
      startedAt: Date.now(),
      finishedAt: undefined,
    };
    this.jobs.set(params.importId, jobSnapshot);

    void (async () => {
      try {
        const entry = await entryPromise;
        if (!entry) {
          throw new BadRequestException('IMPORT_NOT_FOUND_OR_EXPIRED');
        }
        const { mapping } = params;
        const requiredFields = EXPECTED_FIELDS.filter((field) => field.required);
        const missingRequired = requiredFields.filter((field) => {
          const mappedHeader = mapping[field.key as string];
          return !mappedHeader || !entry.headers.includes(mappedHeader);
        });
        if (missingRequired.length) {
          throw new BadRequestException({
            message: 'MAPPING_INCOMPLETE',
            fields: missingRequired.map((field) => field.key),
          });
        }

        const { rows } = await this.parseFile(entry.filePath);
        const fallbackPhoneHeaders = entry.headers.filter((header) => {
          if (!header) return false;
          if (mapping.telefono && header === mapping.telefono) return false;
          const normalized = header.toLowerCase();
          return (
            normalized.includes('celular') ||
            normalized.includes('whatsapp') ||
            normalized.includes('movil') ||
            normalized.includes('m√≥vil')
          );
        });
        const fallbackDniHeaders = entry.headers.filter((header) => {
          if (!header) return false;
          if (mapping.dni && header === mapping.dni) return false;
          const normalized = header.toLowerCase();
          return (
            normalized.includes('identificacion') ||
            normalized.includes('identificaciÛn') ||
            normalized.includes('documento') ||
            normalized.includes('cedula') ||
            normalized.includes('cÈdula') ||
            normalized.includes('dni')
          );
        });
        const fallbackEmailHeaders = entry.headers.filter((header) => {
          if (!header) return false;
          if (mapping.email && header === mapping.email) return false;
          const normalized = header.toLowerCase();
          return (
            normalized.includes('correo') ||
            normalized.includes('email') ||
            normalized.includes('mail')
          );
        });
        jobSnapshot.total = rows.length;
        jobSnapshot.status = 'processing';

        for (let index = 0; index < rows.length; index += 1) {
          const rawRow = rows[index];
          const rowNumber = index + 2;
          const issues: string[] = [];

          const payload: Partial<LeadEntity> = {
            estado_completo: true,
            id_estado_lead: null,
            id_campania: params.campaignId,
            origen: 'De Excel',
          };

          EXPECTED_FIELDS.forEach((field) => {
            const header = mapping[field.key as string];
            if (!header) return;
            const rawValue = this.extractCell(rawRow, header);
            if (field.key === 'id_campania') {
              const parsed = Number(rawValue);
              if (Number.isNaN(parsed)) {
                issues.push('ID de campana invalido');
              } else {
                (payload as any)[field.key] = parsed;
              }
              return;
            }
            if (field.key === 'dni') {
              (payload as any)[field.key] = this.normalizeDniValue(rawValue);
              return;
            }
            if (field.key === 'email') {
              (payload as any)[field.key] = this.normalizeEmailValue(rawValue);
              return;
            }
            (payload as any)[field.key] = this.normalizeOptionalValue(rawValue);
          });

          if (!payload.telefono && fallbackPhoneHeaders.length) {
            for (const header of fallbackPhoneHeaders) {
              const fallbackValue = this.normalizeOptionalValue(this.extractCell(rawRow, header));
              if (fallbackValue) {
                payload.telefono = fallbackValue;
                break;
              }
            }
          }
          if (!payload.dni && fallbackDniHeaders.length) {
            for (const header of fallbackDniHeaders) {
              const fallbackValue = this.normalizeDniValue(this.extractCell(rawRow, header));
              if (fallbackValue) {
                payload.dni = fallbackValue;
                break;
              }
            }
          }
          if (!payload.email && fallbackEmailHeaders.length) {
            for (const header of fallbackEmailHeaders) {
              const fallbackValue = this.normalizeEmailValue(this.extractCell(rawRow, header));
              if (fallbackValue) {
                payload.email = fallbackValue;
                break;
              }
            }
          }

          if (!payload.origen) {
            payload.origen = 'De Excel';
          }

          const requiredFieldDefs = EXPECTED_FIELDS.filter((field) => field.required);
          for (const requiredField of requiredFieldDefs) {
            const value = (payload as any)[requiredField.key];
            if (value === undefined || value === null || String(value).trim() === '') {
              issues.push(`El campo ${requiredField.label} es obligatorio`);
            }
          }

          if (issues.length) {
            jobSnapshot.errors.push({ row: rowNumber, issues });
            jobSnapshot.failed += 1;
            jobSnapshot.processed += 1;
            continue;
          }

          try {
            const normalizedPayload = {
              ...payload,
              id_estado_lead: payload.id_estado_lead ?? null,
              estado_completo: payload.estado_completo ?? true,
              origen: payload.origen ?? 'De Excel',
            };
            await this.leadRepo.create(normalizedPayload);
            jobSnapshot.created += 1;
          } catch (error: any) {
            const dbIssue =
              typeof error?.message === 'string'
                ? error.message
                : 'Error al guardar el lead en la base de datos';
            jobSnapshot.errors.push({
              row: rowNumber,
              issues: [dbIssue],
            });
            jobSnapshot.failed += 1;
          } finally {
            jobSnapshot.processed += 1;
          }
        }

        jobSnapshot.status = 'completed';
        jobSnapshot.finishedAt = Date.now();
      } catch (error) {
        jobSnapshot.status = 'failed';
        jobSnapshot.finishedAt = Date.now();
        jobSnapshot.errors.push({
          row: 0,
          issues: [
            error instanceof Error
              ? error.message
              : 'Error inesperado durante la importaci√≥n',
          ],
        });
      } finally {
        await this.safeCleanup(params.importId).catch(() => undefined);
      }
    })();

    return jobSnapshot;
  }

  getJob(importId: string) {
    const job = this.jobs.get(importId);
    if (!job) {
      throw new BadRequestException('IMPORT_JOB_NOT_FOUND');
    }
    return job;
  }

  async generateTemplate(): Promise<string> {
    const headers = EXPECTED_FIELDS.map((field) => field.label);
    const sampleRow = EXPECTED_FIELDS.map((field) => field.label);
    return `${headers.join(',')}\n${sampleRow.join(',')}\n`;
  }

  private async parseFile(
    filePath: string,
    options: { limit?: number } = {},
  ): Promise<{ headers: string[]; rows: ParsedRow[] }> {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.csv') {
      return this.parseCsv(filePath, options.limit);
    }
    if (extension === '.xlsx' || extension === '.xls') {
      return this.parseXlsx(filePath, options.limit);
    }
    throw new BadRequestException('UNSUPPORTED_FILE_TYPE');
  }

  private parseCsv(filePath: string, limit?: number): Promise<{ headers: string[]; rows: ParsedRow[] }> {
    return new Promise((resolve, reject) => {
      const rows: ParsedRow[] = [];
      let headers: string[] = [];
      const stream = createReadStream(filePath);
      const parser = stream.pipe(
        parse({
          headers: true,
          ignoreEmpty: true,
          trim: true,
        }),
      );

      parser
        .on('error', (error) => reject(error))
        .on('headers', (hdrs) => {
          headers = hdrs.map((header) => header.trim());
        })
        .on('data', (row) => {
          rows.push(row);
          if (limit && rows.length >= limit) {
            stream.destroy();
          }
        })
        .on('end', () => resolve({ headers, rows }));
    });
  }

  private async parseXlsx(filePath: string, limit?: number): Promise<{ headers: string[]; rows: ParsedRow[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return { headers: [], rows: [] };

    const headerRowValues = worksheet.getRow(1).values;
    const headerValues = Array.isArray(headerRowValues) ? headerRowValues : [];
    const headers = headerValues
      .slice(1)
      .map((value) => this.normalizeExcelCell(value))
      .map((value) => value.trim())
      .filter((value) => value.length);

    const rows: ParsedRow[] = [];
    const maxRow = worksheet.actualRowCount;

    for (let rowIndex = 2; rowIndex <= maxRow; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex);
      if (!row || row.cellCount === 0) continue;

      const record: ParsedRow = {};
      headers.forEach((header, headerIndex) => {
        const cellValue = row.getCell(headerIndex + 1).value;
        record[header] = this.normalizeExcelCell(cellValue);
      });

      if (!this.isRowEmpty(record)) {
        rows.push(record);
        if (limit && rows.length >= limit) break;
      }
    }

    return { headers, rows };
  }

  private extractCell(row: Record<string, unknown>, header: string): string {
    const value = row[header];
    if (value === undefined || value === null) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value).trim();
  }

  private normalizeExcelCell(value: ExcelJS.CellValue | undefined): string {
    if (value === undefined || value === null) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
      if ('text' in value && typeof value.text === 'string') {
        return value.text.trim();
      }
      if ('result' in value) {
        return this.normalizeExcelCell(value.result as ExcelJS.CellValue);
      }
      if ('richText' in value && Array.isArray(value.richText)) {
        return value.richText.map((chunk) => chunk.text ?? '').join('').trim();
      }
      if ('hyperlink' in value && 'text' in value && typeof value.text === 'string') {
        return value.text.trim();
      }
    }
    return String(value ?? '').trim();
  }

  private isRowEmpty(row: ParsedRow) {
    return Object.values(row).every((value) => String(value ?? '').trim() === '');
  }

  private normalizeOptionalValue(value: string | null | undefined) {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeDniValue(value: string | null | undefined) {
    if (!value) return null;
    const digits = value.replace(/[^0-9]/g, '');
    return digits.length === 8 ? digits : null;
  }

  private normalizeEmailValue(value: string | null | undefined) {
    if (!value) return null;
    const trimmed = value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? trimmed : null;
  }

  private buildSuggestedMapping(headers: string[]) {
    const mapping: Record<string, string> = {};
    headers.forEach((header) => {
      const normalized = header.toLowerCase();
      for (const field of EXPECTED_FIELDS) {
        const key = field.key as string;
        if (mapping[key]) continue;
        const label = field.label.toLowerCase();
        if (normalized === label || normalized.includes(label)) {
          mapping[key] = header;
          break;
        }
        if (field.key === 'id_campania' && /campana/.test(normalized)) {
          mapping[key] = header;
          break;
        }
        if (field.key === 'nombres' && /nombre/.test(normalized)) {
          mapping[key] = header;
          break;
        }
        if (field.key === 'apellidos' && /apellido/.test(normalized)) {
          mapping[key] = header;
          break;
        }
      }
    });
    return mapping;
  }

  private async safeCleanup(importId: string) {
    const entry = this.pending.get(importId) ?? (await this.restorePendingImport(importId));
    this.pending.delete(importId);
    const metaPath = this.buildMetaPath(importId);
    const cleanupTasks: Array<Promise<unknown>> = [];
    if (entry?.filePath) {
      cleanupTasks.push(
        fs.unlink(entry.filePath).catch(() => {
          /* ignore */
        }),
      );
    }
    cleanupTasks.push(
      fs.unlink(metaPath).catch(() => {
        /* ignore */
      }),
    );
    await Promise.all(cleanupTasks);
  }

  private buildMetaPath(importId: string) {
    return path.join(this.tmpDir, `${importId}.meta.json`);
  }

  private async persistPendingImport(importId: string, entry: PendingImport) {
    this.pending.set(importId, entry);
    await fs.writeFile(this.buildMetaPath(importId), JSON.stringify(entry), 'utf-8');
  }

  private async getPendingImport(importId: string): Promise<PendingImport | undefined> {
    const cached = this.pending.get(importId);
    if (cached) return cached;
    return this.restorePendingImport(importId);
  }

  private async restorePendingImport(importId: string): Promise<PendingImport | undefined> {
    const metaPath = this.buildMetaPath(importId);
    try {
      const raw = await fs.readFile(metaPath, 'utf-8');
      const parsed = JSON.parse(raw) as PendingImport;
      if (!parsed?.filePath || !(await this.fileExists(parsed.filePath))) {
        await fs.unlink(metaPath).catch(() => undefined);
        return undefined;
      }
      this.pending.set(importId, parsed);
      return parsed;
    } catch {
      return undefined;
    }
  }

  private async fileExists(targetPath: string) {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  private async cleanupDanglingImports() {
    await fs.mkdir(this.tmpDir, { recursive: true }).catch(() => undefined);
    let files: string[] = [];
    try {
      files = await fs.readdir(this.tmpDir);
    } catch {
      return;
    }
    const metaFiles = files.filter((file) => file.endsWith('.meta.json'));
    await Promise.all(
      metaFiles.map(async (metaFile) => {
        const importId = metaFile.replace(/\.meta\.json$/, '');
        if (!importId) return;
        const entry = await this.restorePendingImport(importId);
        if (!entry) {
          await this.safeCleanup(importId).catch(() => undefined);
          return;
        }
        const age = Date.now() - (entry.uploadedAt ?? 0);
        if (!entry.uploadedAt || age > this.pendingTtlMs) {
          await this.safeCleanup(importId).catch(() => undefined);
        }
      }),
    );
  }
}

export default LeadImportService;
