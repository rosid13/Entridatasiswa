
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileCheck2 } from 'lucide-react';

export default function AdminPanel() {
  // This component is being deprecated in favor of the new /admin/dashboard page.
  // The content is kept minimal to avoid breaking changes if it's referenced elsewhere unexpectedly.
  return (
    <div className="mt-12 p-4 border rounded-lg bg-card">
        <p className="text-muted-foreground mb-4">
            Manajemen admin telah dipindahkan ke halaman dashboard.
        </p>
        <Link href="/admin/dashboard" passHref>
            <Button variant="outline">
                <FileCheck2 className="mr-2 h-4 w-4" />
                Buka Dashboard Admin
            </Button>
        </Link>
    </div>
  );
}
