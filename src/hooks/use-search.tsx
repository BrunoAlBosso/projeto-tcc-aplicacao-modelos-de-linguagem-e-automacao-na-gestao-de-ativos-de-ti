import { createContext, useContext, useState, ReactNode } from 'react';

type SearchContextType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <SearchContext.Provider value={{ isOpen, onOpen, onClose }}>
      {children}
    </SearchContext.Provider>
  );
};