import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { searchSuggestions as defaultSuggestions, searchProducts } from '@/data/products';

interface SearchContextType {
  searchHistory: string[];
  suggestions: string[];
  recentSearches: string[];
  trendingSearches: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
  getSuggestions: (query: string) => string[];
  getSearchResults: (query: string) => ReturnType<typeof searchProducts>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = 'evara_search_history';

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const trendingSearches = [
    'satin slip dress',
    'diamond bracelet',
    'LED face mask',
    'nail drill machine',
    'black evening dress',
    'gold hoop earrings',
    'pore vacuum cleaner',
    'silk wrap dress'
  ];

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    const trimmedQuery = query.trim().toLowerCase();

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmedQuery);
      return [trimmedQuery, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setSearchHistory(prev => prev.filter(item => item !== query));
  }, []);

  const getSuggestions = useCallback((query: string): string[] => {
    if (!query.trim()) {
      return trendingSearches.slice(0, 6);
    }

    const lowercaseQuery = query.toLowerCase();
    const allSuggestions = [...new Set([...searchHistory, ...defaultSuggestions])];

    const matching = allSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(lowercaseQuery) &&
      suggestion.toLowerCase() !== lowercaseQuery
    );

    return matching.slice(0, 8);
  }, [searchHistory, trendingSearches]);

  const getSearchResults = useCallback((query: string) => {
    if (!query.trim()) return [];
    addToHistory(query);
    return searchProducts(query);
  }, [addToHistory]);

  const recentSearches = searchHistory.slice(0, 5);

  return (
    <SearchContext.Provider
      value={{
        searchHistory,
        suggestions: defaultSuggestions,
        recentSearches,
        trendingSearches,
        addToHistory,
        clearHistory,
        removeFromHistory,
        getSuggestions,
        getSearchResults,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
