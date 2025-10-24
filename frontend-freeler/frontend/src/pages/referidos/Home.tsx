import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { CampaignService, Campaign } from '@/services/campaign.service';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterBar } from '@/components/common/FilterBar';
import { CampaignGrid } from '@/components/common/CampaignGrid';
import { CampaignCard } from '@/components/common/CampaignCard';
import { Dialog } from '@/components/ui/Dialog';
import { LeadFormModal } from '@/components/common/LeadFormModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/common/Toasts';
import { APP_ROUTES } from '@/utils/constants';

type Filters = {
  search?: string;
  estado?: number;
};

const filterChips = [
  { id: 'all', label: 'Todas', estado: undefined },
  { id: 'active', label: 'Activas', estado: 1 },
  { id: 'inactive', label: 'Inactivas', estado: 0 },
];

export const Home = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<Filters>({});
  const [selectedChip, setSelectedChip] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  const queryFilters = useMemo(
    () => ({
      ...(filters.search ? { search: filters.search } : {}),
      ...(typeof filters.estado === 'number' ? { estado: filters.estado } : {}),
    }),
    [filters],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['campaigns', queryFilters],
    queryFn: () => CampaignService.getAll(queryFilters),
  });

  const campaigns = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const handleSearch = (term: string) => {
    setFilters((prev) => ({ ...prev, search: term || undefined }));
  };

  const handleFilterSelect = (chipId: string) => {
    setSelectedChip(chipId);
    const chip = filterChips.find((item) => item.id === chipId);
    setFilters((prev) => ({ ...prev, estado: chip?.estado }));
  };

  const handleRefer = (campaign: Campaign) => {
    if (!user || user.type !== 'freeler') {
      push({
        title: 'Inicia sesion como Freeler',
        description: 'Necesitas iniciar sesion para crear un referido.',
        variant: 'warning',
      });
      navigate(APP_ROUTES.referidos.login);
      return;
    }
    setSelectedCampaign(campaign);
    setLeadModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-colors">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-content">Campaas disponibles</h1>
            <p className="text-sm text-content-muted">
              Explora oportunidades y registra tus referidos para ganar comisiones.
            </p>
          </div>
          <Button variant="ghost" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Actualizar listado
          </Button>
        </div>
        <div className="mt-6 space-y-4">
          <SearchBar onSearch={handleSearch} placeholder="Busca por campaa o empresa" />
          <FilterBar
            chips={filterChips.map((chip) => ({
              id: chip.id,
              label: chip.label,
              isActive: chip.id === selectedChip,
            }))}
            onSelect={handleFilterSelect}
          />
        </div>
      </section>

      {isError && (
        <EmptyState
          title="No pudimos cargar las campaas"
          description="Revisa tu conexion o vuelve a intentarlo mas tarde."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-48 animate-pulse rounded-lg border border-border bg-surface-muted"
            />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No encontramos campaas"
          description="Prueba cambiando los filtros o vuelve mas adelante."
        />
      ) : (
        <CampaignGrid>
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id_campania}
              name={campaign.nombre}
              commission={typeof campaign.comision === 'string' ? Number(campaign.comision) : campaign.comision}
              company={campaign.empresa?.razon_social ?? undefined}
              location={campaign.ubicacion ?? undefined}
              startDate={campaign.fecha_inicio}
              endDate={campaign.fecha_fin}
              onOpen={() => setSelectedCampaign(campaign)}
              onRefer={() => handleRefer(campaign)}
              disabledRefer={!user || user.type !== 'freeler'}
            />
          ))}
        </CampaignGrid>
      )}

      <Dialog
        open={Boolean(selectedCampaign)}
        onOpenChange={(open) => {
          if (!open) setSelectedCampaign(null);
        }}
        title={selectedCampaign?.nombre}
        description={selectedCampaign?.descripcion ?? 'Esta campana no tiene descripcion.'}
        footer={
          selectedCampaign ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSelectedCampaign(null)}>
                Cerrar
              </Button>
              <Button onClick={() => handleRefer(selectedCampaign)}>Anadir referido</Button>
            </div>
          ) : undefined
        }
      />

      <LeadFormModal
        open={leadModalOpen}
        onClose={() => {
          setLeadModalOpen(false);
          setSelectedCampaign(null);
        }}
        campaignId={selectedCampaign?.id_campania}
      />
    </div>
  );
};

export default Home;
