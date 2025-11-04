import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ApiPeruDniResponse = {
  success?: boolean;
  dni?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  codVerifica?: number | string;
  codVerificaLetra?: string;
};

type ApiPeruRucResponse = {
  ruc?: string;
  razonSocial?: string;
  nombreComercial?: string | null;
  estado?: string | null;
  condicion?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  telefonos?: string[] | null;
  ubigeo?: string | null;
  capital?: string | null;
};

type GraphPeruResponse = {
  documentID?: string;
  names?: string;
  surnames?: string;
  fullName?: string;
  paternalLastName?: string;
  maternalLastName?: string;
  name?: string;
  address?: string;
  district?: string;
  province?: string;
  region?: string;
  error?: string | null;
};

export type DniLookupResult = {
  dni: string;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  verificador?: string | null;
};

export type RucLookupResult = {
  ruc: string;
  razonSocial: string | null;
  nombreComercial: string | null;
  estado: string | null;
  condicion: string | null;
  direccion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  telefonos: string[];
  ubigeo: string | null;
  capital: string | null;
};

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);
  private readonly baseUrl: string;
  private readonly fallbackUrl: string;
  private readonly token: string;
  private readonly enableFallback: boolean;
  private readonly timeout: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('apiperu.baseUrl')!;
    this.fallbackUrl = this.config.get<string>('apiperu.fallbackUrl')!;
    this.token = this.config.get<string>('apiperu.token') ?? '';
    this.enableFallback = this.config.get<boolean>('apiperu.enableFallback') ?? true;
    this.timeout = this.config.get<number>('apiperu.timeout') ?? 5000;
  }

  async consultarDni(dni: string): Promise<DniLookupResult | null> {
    const primary = await this.consultarDniApiPeru(dni);
    if (primary) return primary;
    if (!this.enableFallback) return null;
    return this.consultarDniFallback(dni);
  }

  async consultarRuc(ruc: string): Promise<RucLookupResult | null> {
    const primary = await this.consultarRucApiPeru(ruc);
    if (primary) return primary;
    if (!this.enableFallback) return null;
    return this.consultarRucFallback(ruc);
  }

  private capitalize(value?: string | null): string | null {
    if (!value) return null;
    return value
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async consultarDniApiPeru(dni: string): Promise<DniLookupResult | null> {
    if (!this.token) {
      this.logger.warn('APISPERU token no configurado; omitiendo consulta principal para DNI');
      return null;
    }

    const url = `${this.baseUrl}/dni/${dni}?token=${this.token}`;
    try {
      const data = await this.fetchJson<ApiPeruDniResponse>(url);
      if (!data || (!data.success && data.success !== undefined)) return null;
      if (!data?.dni) return null;
      return {
        dni: data.dni,
        nombres: this.capitalize(data.nombres),
        apellidoPaterno: this.capitalize(data.apellidoPaterno),
        apellidoMaterno: this.capitalize(data.apellidoMaterno),
        verificador:
          data.codVerificaLetra ??
          (data.codVerifica !== undefined ? String(data.codVerifica) : null),
      };
    } catch (error) {
      this.logger.error(`Error consultando DNI en ApiPeru: ${(error as Error).message}`);
      return null;
    }
  }

  private async consultarRucApiPeru(ruc: string): Promise<RucLookupResult | null> {
    if (!this.token) {
      this.logger.warn('APISPERU token no configurado; omitiendo consulta principal para RUC');
      return null;
    }

    const url = `${this.baseUrl}/ruc/${ruc}?token=${this.token}`;
    try {
      const data = await this.fetchJson<ApiPeruRucResponse>(url);
      if (!data?.ruc) return null;
      return {
        ruc: data.ruc,
        razonSocial: this.capitalize(data.razonSocial),
        nombreComercial: this.capitalize(data.nombreComercial),
        estado: data.estado ?? null,
        condicion: data.condicion ?? null,
        direccion: this.capitalize(data.direccion),
        departamento: this.capitalize(data.departamento),
        provincia: this.capitalize(data.provincia),
        distrito: this.capitalize(data.distrito),
        telefonos: Array.isArray(data.telefonos)
          ? data.telefonos.filter((telefono): telefono is string => Boolean(telefono))
          : [],
        ubigeo: data.ubigeo ?? null,
        capital: this.capitalize(data.capital),
      };
    } catch (error) {
      this.logger.error(`Error consultando RUC en ApiPeru: ${(error as Error).message}`);
      return null;
    }
  }

  private async consultarDniFallback(dni: string): Promise<DniLookupResult | null> {
    try {
      const data = await this.fetchJson<GraphPeruResponse>(`${this.fallbackUrl}/${dni}`);
      if (!data || data.error) return null;
      const surname =
        data.surnames?.split(' ') ??
        [data.paternalLastName, data.maternalLastName].filter(Boolean);
      const apellidoPaterno = data.paternalLastName ?? surname?.[0] ?? null;
      const apellidoMaterno =
        data.maternalLastName ?? (surname && surname.length > 1 ? surname.slice(1).join(' ') : null);

      return {
        dni: data.documentID ?? dni,
        nombres: this.capitalize(data.names),
        apellidoPaterno: this.capitalize(apellidoPaterno),
        apellidoMaterno: this.capitalize(apellidoMaterno),
        verificador: null,
      };
    } catch (error) {
      this.logger.error(`Error consultando fallback DNI: ${(error as Error).message}`);
      return null;
    }
  }

  private async consultarRucFallback(ruc: string): Promise<RucLookupResult | null> {
    try {
      const data = await this.fetchJson<GraphPeruResponse>(`${this.fallbackUrl}/${ruc}`);
      if (!data || data.error) return null;
      return {
        ruc: data.documentID ?? ruc,
        razonSocial: this.capitalize(data.name),
        nombreComercial: null,
        estado: null,
        condicion: null,
        direccion: this.capitalize(data.address),
        departamento: this.capitalize(data.region),
        provincia: this.capitalize(data.province),
        distrito: this.capitalize(data.district),
        telefonos: [],
        ubigeo: null,
        capital: null,
      };
    } catch (error) {
      this.logger.error(`Error consultando fallback RUC: ${(error as Error).message}`);
      return null;
    }
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        this.logger.warn(`Peticion HTTP no exitosa: [${response.status}] ${url}`);
        return null;
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default DocumentosService;
