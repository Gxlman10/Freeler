import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { LeadDraft, LeadService } from '@/services/lead.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/common/Toasts';
import { isValidDni, isValidEmail } from '@/utils/validators';
import { queryDocument } from '@/services/document.service';

type LeadFormProps = {
  campaignId?: number;
  onSubmitted?: (leadId: number) => void;
};

const ORIGIN_VALUE = 'Freeler';

const initialDraft: LeadDraft = {
  nombres: '',
  apellidos: '',
  dni: '',
  email: '',
  telefono: '',
  ciudad: '',
  ocupacion: '',
  descripcion: '',
  origen: ORIGIN_VALUE,
};

export const LeadForm = ({ campaignId, onSubmitted }: LeadFormProps) => {
  const { user } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState<LeadDraft>(() => ({
    ...initialDraft,
    id_campania: campaignId,
    id_usuario_freeler: user?.type === 'freeler' ? user.id : undefined,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dniStatus, setDniStatus] = useState<'idle' | 'loading' | 'success' | 'not-found'>('idle');
  const lastLookupRef = useRef<string>('');

  useEffect(() => {
    const draft = LeadService.getDraft();
    if (draft) {
      setForm((prev) => ({
        ...initialDraft,
        ...prev,
        ...draft,
        origen: draft.origen ?? ORIGIN_VALUE,
        id_campania: draft.id_campania ?? campaignId ?? prev.id_campania,
        id_usuario_freeler: draft.id_usuario_freeler ?? (user?.type === 'freeler' ? user.id : prev.id_usuario_freeler),
      }));
      return;
    }
    setForm((prev) => ({
      ...initialDraft,
      ...prev,
      id_campania: campaignId ?? prev.id_campania,
      id_usuario_freeler: user?.type === 'freeler' ? user.id : prev.id_usuario_freeler,
    }));
  }, [campaignId, user?.id, user?.type]);

  useEffect(() => {
    LeadService.saveDraft({
      ...form,
      origen: ORIGIN_VALUE,
      id_campania: form.id_campania ?? campaignId,
      id_usuario_freeler:
        form.id_usuario_freeler ?? (user?.type === 'freeler' ? user.id : undefined),
    });
  }, [form, campaignId, user?.id, user?.type]);

  useEffect(() => {
    const value = (form.dni ?? '').trim();
    if (value.length !== 8) {
      setDniStatus('idle');
      return;
    }

    if (lastLookupRef.current === value) return;

    let cancelled = false;
    setDniStatus('loading');

    queryDocument(value)
      .then((data) => {
        if (cancelled) return;
        if (data && 'names' in data) {
          setForm((prev) => ({
            ...prev,
            nombres: data.names ?? prev.nombres,
            apellidos:
              data.surnames ??
              [data.paternalLastName, data.maternalLastName].filter(Boolean).join(' ') || prev.apellidos,
          }));
          setDniStatus('success');
        } else {
          setDniStatus('not-found');
        }
        lastLookupRef.current = value;
      })
      .catch(() => {
        if (!cancelled) setDniStatus('not-found');
      });

    return () => {
      cancelled = true;
    };
  }, [form.dni]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange =
    (field: keyof LeadDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((prev) => {
        if (field === 'telefono') {
          const digits = value.replace(/\D/g, '').slice(0, 9);
          return { ...prev, telefono: digits };
        }
        if (field === 'dni') {
          const digits = value.replace(/\D/g, '').slice(0, 8);
          return { ...prev, dni: digits };
        }
        return { ...prev, [field]: value };
      });
      clearError(field as string);
    };

  const handleSaveDraft = () => {
    LeadService.saveDraft({
      ...form,
      origen: ORIGIN_VALUE,
      id_campania: form.id_campania ?? campaignId,
      id_usuario_freeler:
        form.id_usuario_freeler ?? (user?.type === 'freeler' ? user.id : undefined),
    });
    setFeedback('Borrador guardado localmente.');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const nextErrors: Record<string, string> = {};
    if (!isValidDni(form.dni ?? '')) nextErrors.dni = 'Ingresa un DNI valido (8 digitos).';
    if (!form.nombres?.trim()) nextErrors.nombres = 'Ingresa el nombre del referido.';
    if (!form.apellidos?.trim()) nextErrors.apellidos = 'Ingresa los apellidos del referido.';
    const phoneDigits = (form.telefono ?? '').replace(/\D/g, '');
    if (phoneDigits.length !== 9) nextErrors.telefono = 'Ingresa un numero valido (9 digitos).';
    if (form.email && !isValidEmail(form.email)) nextErrors.email = 'Ingresa un correo valido.';
    if (!form.ciudad?.trim()) nextErrors.ciudad = 'Ingresa la ciudad.';
    if (!form.ocupacion?.trim()) nextErrors.ocupacion = 'Ingresa la ocupacion.';
    if (!form.descripcion?.trim()) nextErrors.descripcion = 'Describe brevemente el referido.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const digits = (form.telefono ?? '').replace(/\D/g, '');
      const formattedPhone = digits ? `+51${digits}` : undefined;
      const payload: LeadDraft = {
        nombres: form.nombres?.trim(),
        apellidos: form.apellidos?.trim(),
        dni: form.dni?.trim(),
        email: form.email?.trim() || undefined,
        telefono: formattedPhone,
        ciudad: form.ciudad?.trim() || undefined,
        ocupacion: form.ocupacion?.trim() || undefined,
        descripcion: form.descripcion?.trim() || undefined,
        origen: ORIGIN_VALUE,
        id_campania: form.id_campania ?? campaignId,
        id_usuario_freeler: user?.type === 'freeler' ? user.id : undefined,
      };

      const lead = await LeadService.create(payload);
      LeadService.clearDraft();
      setForm({ ...initialDraft, id_campania: campaignId });
      setDniStatus('idle');
      setErrors({});
      setFeedback(`Lead enviado con exito${lead?.id_lead ? ` (ID ${lead.id_lead})` : ''}.`);
      push({ title: 'Referido registrado', description: 'Compartimos los datos con el equipo de campanas.' });
      onSubmitted?.(lead?.id_lead ?? 0);
    } catch (error) {
      setFeedback('Ocurrio un problema al enviar el lead. Intenta nuevamente.');
      push({ title: 'No pudimos registrar el referido', description: 'Intenta nuevamente.', variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="DNI"
          required
          value={form.dni ?? ''}
          inputMode="numeric"
          maxLength={8}
          leadingElement={
            dniStatus === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : dniStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin text-content-muted" />
            ) : undefined
          }
          isValid={dniStatus === 'success'}
          helperText={dniStatus === 'not-found' ? 'No encontramos datos para este DNI.' : undefined}
          error={errors.dni}
          onChange={handleChange('dni')}
        />
        <Input
          label="Nombres"
          required
          value={form.nombres ?? ''}
          error={errors.nombres}
          onChange={handleChange('nombres')}
        />
        <Input
          label="Apellidos"
          required
          value={form.apellidos ?? ''}
          error={errors.apellidos}
          onChange={handleChange('apellidos')}
        />
        <Input
          label="Telefono (WhatsApp)"
          required
          value={form.telefono ?? ''}
          inputMode="tel"
          leadingElement={<span className="text-xs font-semibold text-content-muted">+51</span>}
          helperText="Ingresa solo numeros, sin espacios."
          error={errors.telefono}
          onChange={handleChange('telefono')}
        />
        <Input
          label="Correo"
          type="email"
          value={form.email ?? ''}
          error={errors.email}
          onChange={handleChange('email')}
        />
        <Input
          label="Ciudad"
          required
          value={form.ciudad ?? ''}
          error={errors.ciudad}
          onChange={handleChange('ciudad')}
        />
        <Input
          label="Ocupacion"
          required
          value={form.ocupacion ?? ''}
          error={errors.ocupacion}
          onChange={handleChange('ocupacion')}
        />
      </div>
      <Textarea
        label="Descripcion"
        minRows={3}
        required
        value={form.descripcion ?? ''}
        error={errors.descripcion}
        onChange={handleChange('descripcion')}
      />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={handleSaveDraft}>
          Guardar borrador
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Enviar
        </Button>
      </div>
      {feedback && <p className="text-sm text-content-muted">{feedback}</p>}
    </form>
  );
};

export default LeadForm;
