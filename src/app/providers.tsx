"use client";

import { AcademicYearProvider } from '@/context/academic-year-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AcademicYearProvider>
        {children}
    </AcademicYearProvider>
  );
}
