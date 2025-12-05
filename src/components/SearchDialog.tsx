import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useSearch } from '@/hooks/use-search';
import { supabase } from '@/lib/supabaseClient';
import { File, User } from 'lucide-react';

export function SearchDialog() {
  const navigate = useNavigate();
  const { isOpen, onClose } = useSearch();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchSearchableData = async () => {
        const { data: itemsData } = await supabase.from('configuration_items').select('id, name');
        const { data: usersData } = await supabase.from('users').select('id, name');
        setItems(itemsData || []);
        setUsers(usersData || []);
      };
      fetchSearchableData();
    }
  }, [isOpen]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder="Procure por itens ou usuários..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Itens de Configuração">
          {items.map((item) => (
            <CommandItem key={item.id} onSelect={() => handleSelect(`/configuration-items`)}>
              <File className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Usuários">
          {users.map((user) => (
            <CommandItem key={user.id} onSelect={() => handleSelect('/users')}>
              <User className="mr-2 h-4 w-4" />
              <span>{user.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
