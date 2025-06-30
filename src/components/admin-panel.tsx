"use client";

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function AdminPanel() {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Gagal!',
        description: 'User ID tidak boleh kosong.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRoleRef = doc(db, 'userRoles', userId);
      await setDoc(userRoleRef, { role }, { merge: true });
      toast({
        title: 'Sukses!',
        description: `Peran untuk user ${userId} telah diatur menjadi ${role}.`,
      });
      setUserId('');
    } catch (error) {
      console.error("Error setting user role: ", error);
      toast({
        variant: 'destructive',
        title: 'Gagal!',
        description: 'Terjadi kesalahan saat mengatur peran user.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>Atur peran pengguna di sini. Hanya admin yang bisa melihat panel ini.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Masukkan User ID dari Firebase Auth"
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Jadikan Admin
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
