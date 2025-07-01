import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Manajemen Data Siswa',
  description: 'Aplikasi manajemen data siswa modern.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        <div className="app-wrapper">
          <Providers>
              {children}
              <Toaster />
          </Providers>
        </div>
      </body>
    </html>
  );
}
