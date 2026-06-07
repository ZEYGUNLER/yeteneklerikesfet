import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Child } from '@/services/child.service';
import { persist } from '@/services/storage';

const SELECTED_CHILD_KEY = 'yk.child.selected';

type ChildContextType = {
  selectedChild: Child | null;
  isRestoring: boolean;
  setSelectedChild: (child: Child | null) => Promise<void>;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedChild, setSelectedChildState] = useState<Child | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const raw = await persist.get(SELECTED_CHILD_KEY);
      if (!raw) {
        setIsRestoring(false);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Child;
        setSelectedChildState(parsed);
      } catch {
        await persist.remove(SELECTED_CHILD_KEY);
      } finally {
        setIsRestoring(false);
      }
    };
    restore();
  }, []);

  const value = useMemo<ChildContextType>(
    () => ({
      selectedChild,
      isRestoring,
      setSelectedChild: async (child) => {
        setSelectedChildState(child);
        if (child) {
          await persist.set(SELECTED_CHILD_KEY, JSON.stringify(child));
        } else {
          await persist.remove(SELECTED_CHILD_KEY);
        }
      },
    }),
    [selectedChild, isRestoring],
  );

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>;
};

export const useChildContext = () => {
  const context = useContext(ChildContext);
  if (!context) throw new Error('useChildContext must be used within ChildProvider');
  return context;
};
