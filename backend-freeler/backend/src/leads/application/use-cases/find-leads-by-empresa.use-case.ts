import {
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';
import { FindLeadsDto } from '../../infrastructure/dto/find-leads.dto';
import {
  IUsuarioEmpresaRepository,
  USUARIO_EMPRESA_REPOSITORY,
} from '../../../usuarios-empresa/application/interfaces/usuario-empresa.repository.interface';
import { CampanaEntity } from '../../../campanas/infrastructure/entities/campana.entity';
import { LeadEntity } from '../../infrastructure/entities/lead.entity';

type CampaignSummary = {
  id_campania: number;
  nombre: string;
  totalReferidos: number;
};

type LeadByEmpresaResponse = {
  data: Awaited<ReturnType<ILeadRepository['paginate']>>['data'];
  total: number;
  page: number;
  limit: number;
  campaigns: CampaignSummary[];
};

@Injectable()
export class FindLeadsByEmpresaUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepo: ILeadRepository,
    @Inject(USUARIO_EMPRESA_REPOSITORY)
    private readonly usuariosEmpresaRepo: IUsuarioEmpresaRepository,
    @InjectRepository(CampanaEntity)
    private readonly campanaRepo: Repository<CampanaEntity>,
  ) {}

  async execute(
    actorId: number,
    filters: FindLeadsDto,
  ): Promise<LeadByEmpresaResponse> {
    const actor = await this.usuariosEmpresaRepo.findById(actorId);
    if (!actor?.id_empresa) {
      throw new ForbiddenException('EMPRESA_CONTEXT_REQUIRED');
    }

    const vendorTargetId =
      typeof filters.asignado_a_usuario_empresa_id === 'number'
        ? filters.asignado_a_usuario_empresa_id
        : undefined;

    if (vendorTargetId) {
      const { data, total, page, limit } =
        await this.leadRepo.paginateAssignedTo(vendorTargetId, {
          ...filters,
          solo_referidos: false,
          estado_completo: filters.estado_completo,
          id_empresa: actor.id_empresa ?? undefined,
        });
      return {
        data,
        total,
        page,
        limit,
        campaigns: this.buildCampaignSummaryFromLeads(data),
      };
    }

    const soloReferidos = filters.solo_referidos ?? true;

    const joinCondition = soloReferidos
      ? `lead.estado_completo = :estado AND (lead.id_usuario_freeler IS NOT NULL OR LOWER(COALESCE(lead.origen, '')) = :freelerOrigen)`
      : '1=1';

    const joinParams = soloReferidos
      ? {
          estado: true,
          freelerOrigen: 'freeler',
        }
      : {};

    const campaignsQuery = this.campanaRepo
      .createQueryBuilder('c')
      .select(['c.id_campania AS id_campania', 'c.nombre AS nombre'])
      .addSelect('COUNT(lead.id_lead)', 'totalReferidos')
      .leftJoin(
        'c.leads',
        'lead',
        joinCondition,
        joinParams,
      )
      .where('c.id_empresa = :empresa', { empresa: actor.id_empresa })
      .groupBy('c.id_campania')
      .having('COUNT(lead.id_lead) > 0');

    if (filters.id_campanias?.length) {
      campaignsQuery.andWhere('c.id_campania IN (:...campanias)', {
        campanias: filters.id_campanias,
      });
    }

    const campaignsRaw = await campaignsQuery.getRawMany<{
      id_campania: number;
      nombre: string;
      totalReferidos: string;
    }>();

    const campaigns = campaignsRaw.map((row) => ({
      id_campania: Number(row.id_campania),
      nombre: row.nombre,
      totalReferidos: Number(row.totalReferidos),
    }));

    const campaignIds = campaigns.map((campaign) => campaign.id_campania);
    if (soloReferidos && !campaignIds.length) {
      return {
        data: [],
        total: 0,
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        campaigns,
      };
    }

    const selectedCampaignIds =
      filters.id_campanias?.length ? filters.id_campanias : soloReferidos ? campaignIds : undefined;

    const {
      data,
      total,
      page: currentPage,
      limit: currentLimit,
    } = await this.leadRepo.paginate({
      ...filters,
      id_empresa: actor.id_empresa ?? undefined,
      id_campanias: selectedCampaignIds,
      estado_completo: soloReferidos ? true : filters.estado_completo,
    });

    return {
      data,
      total,
      page: currentPage,
      limit: currentLimit,
      campaigns,
    };
  }

  private buildCampaignSummaryFromLeads(leads: LeadEntity[]): CampaignSummary[] {
    const summaryMap = new Map<number, CampaignSummary>();
    leads.forEach((lead) => {
      const campaignId = lead.campania?.id_campania ?? lead.id_campania;
      if (!campaignId) return;
      if (!summaryMap.has(campaignId)) {
        summaryMap.set(campaignId, {
          id_campania: campaignId,
          nombre: lead.campania?.nombre ?? 'Campana',
          totalReferidos: 0,
        });
      }
      const current = summaryMap.get(campaignId);
      if (current) current.totalReferidos += 1;
    });
    return Array.from(summaryMap.values());
  }
}

export default FindLeadsByEmpresaUseCase;
