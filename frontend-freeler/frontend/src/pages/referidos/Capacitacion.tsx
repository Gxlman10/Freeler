import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Message = {
  author: 'user' | 'assistant';
  text: string;
};

const initialMessages: Message[] = [
  {
    author: 'assistant',
    text: 'Hola, soy tu asistente Freeler. Preguntame sobre la campania, comisiones o mejores practicas.',
  },
];

export const Capacitacion = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { author: 'user', text: input }]);
    setMessages((prev) => [
      ...prev,
      {
        author: 'assistant',
        text: 'Gracias por tu pregunta. El equipo esta preparando el chatbot para darte respuestas utiles.',
      },
    ]);
    setInput('');
  };

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <header>
        <h1 className="text-3xl font-semibold text-content">Capacitacion Freeler</h1>
        <p className="text-sm text-content-muted">
          Proximamente podras conversar con un asistente sobre campanias, beneficios y consejos de venta.
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div className="flex h-80 flex-col gap-3 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={`${message.author}-${index}`}
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                message.author === 'assistant'
                  ? 'self-start bg-primary-50 text-primary-700'
                  : 'self-end bg-surface-muted text-content'
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            placeholder="Escribe tu pregunta..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button onClick={handleSend}>Enviar</Button>
        </div>
      </div>
    </section>
  );
};

export default Capacitacion;
