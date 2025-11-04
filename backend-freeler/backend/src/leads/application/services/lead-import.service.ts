import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs, createReadStream } from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
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

type ParsedRow = Record<string, string>;

// Modelo mínimo del archivo recibido desde Multer (evitamos depender del type completo)
export type ImportUploadedFile = {
  path: string;
  originalname: string;
};

const EXPECTED_FIELDS: Array<{ key: keyof LeadEntity; label: string; required?: boolean }> = [
  { key: 'nombres', label: 'Nombres', required: true },
  { key: 'apellidos', label: 'Apellidos', required: true },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Telefono' },
  { key: 'dni', label: 'DNI' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'ocupacion', label: 'Ocupacion' },
  { key: 'descripcion', label: 'Descripcion' },
];

@Injectable()
export class LeadImportService {
  private readonly tmpDir = path.resolve(process.cwd(), 'tmp', 'lead-imports');
  private readonly pending = new Map<string, PendingImport>();

  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepo: ILeadRepository,
  ) {}

  async preparePreview(file: ImportUploadedFile | undefined) {
    if (!file) {
      throw new BadRequestException('FILE_REQUIRED');
    }
    await fs.mkdir(this.tmpDir, { recursive: true });
    const extension = path.extname(file.originalname).toLowerCase();
    const importId = randomUUID();
    const destination = path.join(this.tmpDir, `${importId}${extension}`);
    await fs.rename(file.path, destination);

    const { headers, rows } = await this.parseFile(destination, {
      limit: 5,
    });
    if (!headers.length) {
      this.safeCleanup(importId);
      throw new BadRequestException('EMPTY_FILE');
    }

    this.pending.set(importId, {
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

  async processImport(params: {
    importId: string;
    mapping: Record<string, string>;
    usuarioEmpresaId: number;
    campaignId: number;
    actorLabel?: string;
  }) {
    const entry = this.pending.get(params.importId);
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
    const errors: Array<{ row: number; issues: string[] }> = [];
    let created = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const rawRow = rows[index];
      const rowNumber = index + 2; // considering header row
      const issues: string[] = [];

      const payload: Partial<LeadEntity> = {
        estado_completo: true,
        id_estado_lead: 1,
        id_campania: params.campaignId,
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
        if (field.key === 'origen') {
          (payload as any)[field.key] = rawValue ?? null;
          return;
        }
        (payload as any)[field.key] = rawValue ?? null;
      });

      if (!payload.origen) {
        const actor = params.actorLabel ?? 'Usuario';
        payload.origen = `Importación ${index + 1} de Excel por ${actor}`;
      }

      for (const requiredField of requiredFields) {
        const value = (payload as any)[requiredField.key];
        if (value === undefined || value === null || String(value).trim() === '') {
          issues.push(`El campo ${requiredField.label} es obligatorio`);
        }
      }

      if (issues.length) {
        errors.push({ row: rowNumber, issues });
        continue;
      }

      try {
        await this.leadRepo.create(payload);
        created += 1;
      } catch (error) {
        errors.push({
          row: rowNumber,
          issues: ['Error al guardar el lead en la base de datos'],
        });
      }
    }

    this.safeCleanup(params.importId);

    return {
      total: rows.length,
      created,
      failed: errors.length,
      errors,
    };
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

  private parseXlsx(filePath: string, limit?: number): { headers: string[]; rows: ParsedRow[] } {
    const workbook = XLSX.readFile(filePath, { cellDates: true, raw: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const headerRow: string[] = (
      XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as string[][]
    )[0] || [];

    const normalizedHeaders = headerRow.map((header) =>
      typeof header === 'string' ? header.trim() : String(header ?? '').trim(),
    );

    const jsonRows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      blankrows: false,
    }) as Record<string, unknown>[];

    const rows = (limit ? jsonRows.slice(0, limit) : jsonRows).map((row) => {
      const normalized: ParsedRow = {};
      normalizedHeaders.forEach((header) => {
        normalized[header] = this.extractCell(row, header);
      });
      return normalized;
    });

    return { headers: normalizedHeaders, rows };
  }

  private extractCell(row: Record<string, unknown>, header: string): string {
    const value = row[header];
    if (value === undefined || value === null) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value).trim();
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
    const entry = this.pending.get(importId);
    if (!entry) return;
    this.pending.delete(importId);
    try {
      await fs.unlink(entry.filePath);
    } catch {
      // ignore
    }
  }

}

export default LeadImportService;
