import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

type SearchBarProps = {
  defaultValue?: string;
  placeholder?: string;
  isLoading?: boolean;
  onSearch: (term: string) => void;
  onClear?: () => void;
  className?: string;
};

export const SearchBar = ({
  // Barra de busqueda reutilizable para listas filtrables
  defaultValue = '',
  placeholder = 'Buscar...',
  isLoading = false,
  onSearch,
  onClear,
  className,
}: SearchBarProps) => {
  const [term, setTerm] = useState(defaultValue);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(term.trim());
  };

  const handleClear = () => {
    setTerm('');
    onClear?.();
  };

  return (
    <form
      className={cn('flex w-full flex-col gap-2 sm:flex-row sm:items-center', className)}
      onSubmit={handleSubmit}
    >
      <Input
        placeholder={placeholder}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        className="flex-1"
      />
      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          Buscar
        </Button>
        {term && (
          <Button type="button" variant="ghost" onClick={handleClear}>
            Limpiar
          </Button>
        )}
      </div>
    </form>
  );
};
