"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AcademicYearContextType {
  activeYear: string | null;
  setActiveYear: (year: string) => void;
  isLoading: boolean;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [activeYear, setActiveYearInternal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedYear = localStorage.getItem('activeAcademicYear');
      if (storedYear) {
        setActiveYearInternal(storedYear);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setActiveYear = (year: string) => {
    try {
        localStorage.setItem('activeAcademicYear', year);
        setActiveYearInternal(year);
    } catch (error) {
        console.error("Could not write to localStorage", error);
    }
  };

  return (
    <AcademicYearContext.Provider value={{ activeYear, setActiveYear, isLoading }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
}
