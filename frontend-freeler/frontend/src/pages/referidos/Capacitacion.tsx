import { FormEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IaService } from '@/services/ia.service';
import { useToast } from '@/components/common/Toasts';

type Message = {
  author: 'user' | 'assistant';
  text: string;
};

const initialMessages: Message[] = [
  {
    author: 'assistant',
    text: 'Hola, soy Freeler Coach. Pregúntame cómo atraer referidos de calidad, vender campañas o qué datos compartir.',
  },
];

export const Capacitacion = () => {
  const { push } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: { message: string; history: { role: 'user' | 'assistant'; content: string }[] }) =>
      IaService.chat(payload),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { author: 'assistant', text: data.reply }]);
    },
    onError: () => {
      push({
        title: 'No pude conectarme con la IA',
        description: 'Intenta nuevamente en unos instantes.',
        variant: 'danger',
      });
      setMessages((prev) => [
        ...prev,
        {
          author: 'assistant',
          text: 'Hubo un problema al generar la respuesta. Por favor, inténtalo de nuevo.',
        },
      ]);
    },
  });

  const trimmedHistory = useMemo(
    () =>
      messages
        .slice(-6)
        .map((message) => ({ role: message.author, content: message.text })) as {
        role: 'user' | 'assistant';
        content: string;
      }[],
    [messages],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((prev) => [...prev, { author: 'user', text: question }]);
    setInput('');
    mutation.mutate({
      message: question,
      history: trimmedHistory,
    });
  };

  const isTyping = mutation.isPending;

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <header>
        <h1 className="text-3xl font-semibold text-content">Capacitación Freeler</h1>
        <p className="text-sm text-content-muted">
          Conversa con Freeler Coach para aprender a captar y vender referidos de calidad.
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-md">
        <div className="flex h-[34rem] flex-col gap-3 overflow-y-auto pr-2">
          {messages.map((message, index) => (
            <div
              key={`${message.author}-${index}`}
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                message.author === 'assistant'
                  ? 'self-start bg-primary-50 text-primary-700'
                  : 'self-end bg-surface-muted text-content'
              }`}
            >
              {message.text}
            </div>
          ))}
          {isTyping && (
            <div className="self-start rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700">
              Freeler Coach está escribiendo...
            </div>
          )}
        </div>
        <form className="flex items-center gap-3" onSubmit={handleSubmit}>
          <Input
            className="flex-1"
            placeholder="Escribe tu pregunta..."
            value={input}
            disabled={mutation.isPending}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button type="submit" disabled={mutation.isPending} variant="primary" className="min-w-[132px]">
            {mutation.isPending ? (
              'Enviando...'
            ) : (
              <>
                Enviar
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Capacitacion;
