import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatDate } from '@/utils/helpers';

type CampaignCardProps = {
  name: string;
  commission: number;
  company?: string;
  location?: string | null;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  onOpen: () => void;
  onRefer?: () => void;
  disabledRefer?: boolean;
};

export const CampaignCard = ({
  name,
  commission,
  company,
  location,
  startDate,
  endDate,
  tags = [],
  onOpen,
  onRefer,
  disabledRefer = false,
}: CampaignCardProps) => (
  // Tarjeta de campania alineada con la paleta global
  <Card className="h-full">
    <CardHeader className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-content">{name}</h3>
          {company && (
            <p className="text-xs uppercase tracking-wide text-content-subtle">
              {company}
            </p>
          )}
        </div>
        <Badge>{commission ? `${commission}% comision` : 'Comision variable'}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-content-subtle">
        {location && <span>{location}</span>}
        {startDate && endDate && <span>Del {formatDate(startDate)} al {formatDate(endDate)}</span>}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-md bg-primary-50 px-4 py-3 text-sm text-primary-700">
        <span className="font-medium">Comision</span>
        <span>{commission ? `${commission}%` : 'Variable'}</span>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onOpen}>
          Ver detalles
        </Button>
        {onRefer && (
          <Button className="flex-1" variant="outline" onClick={onRefer} disabled={disabledRefer}>
            Anadir referido
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);
