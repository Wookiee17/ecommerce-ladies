import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type CategoryType = 'all' | 'dress' | 'jewelry' | 'beauty';

interface CategoryContextType {
  activeCategory: CategoryType;
  setActiveCategory: (category: CategoryType) => void;
  getBackgroundClass: () => string;
  getAccentColor: () => string;
}

const categoryStyles: Record<CategoryType, { bg: string; accent: string }> = {
  all: {
    bg: 'from-cream to-white',
    accent: '#ff6c79'
  },
  dress: {
    bg: 'from-rose-50 via-rose-100/50 to-pink-50',
    accent: '#ff6c79'
  },
  jewelry: {
    bg: 'from-orange-50 via-amber-100/50 to-yellow-50',
    accent: '#e8a87c'
  },
  beauty: {
    bg: 'from-purple-50 via-lavender-100/50 to-violet-50',
    accent: '#c084fc'
  }
};

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategoryState] = useState<CategoryType>('all');

  const setActiveCategory = useCallback((category: CategoryType) => {
    setActiveCategoryState(category);
  }, []);

  const getBackgroundClass = useCallback(() => {
    return categoryStyles[activeCategory].bg;
  }, [activeCategory]);

  const getAccentColor = useCallback(() => {
    return categoryStyles[activeCategory].accent;
  }, [activeCategory]);

  return (
    <CategoryContext.Provider
      value={{
        activeCategory,
        setActiveCategory,
        getBackgroundClass,
        getAccentColor,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}
