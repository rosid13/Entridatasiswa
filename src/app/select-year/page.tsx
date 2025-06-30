"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { useAcademicYear } from '@/context/academic-year-context';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar } from 'lucide-react';
import Footer from '@/components/footer';

const academicYears = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];

export default function SelectYearPage() {
    const router = useRouter();
    const { setActiveYear, activeYear } = useAcademicYear();
    const [selectedYear, setSelectedYear] = useState<string>(activeYear || "");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
            } else {
                setIsCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleContinue = async () => {
        if (!selectedYear) {
            toast({
                variant: 'destructive',
                title: 'Pilihan Dibutuhkan',
                description: 'Anda harus memilih tahun ajaran untuk melanjutkan.'
            });
            return;
        };

        setActiveYear(selectedYear);
        
        const currentUser = auth.currentUser;
        if(currentUser) {
            const userRoleRef = doc(db, "userRoles", currentUser.uid);
            const docSnap = await getDoc(userRoleRef);
            const userRole = (docSnap.exists() && docSnap.data().role) ? docSnap.data().role : 'user';
            
            if (userRole === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
        } else {
             router.push('/login');
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex flex-grow flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center">
                        <Calendar className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h1 className="text-3xl font-bold text-foreground">Pilih Tahun Ajaran</h1>
                        <p className="mt-2 text-muted-foreground">
                            Pilih tahun ajaran yang ingin Anda kelola.
                        </p>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tahun Ajaran</CardTitle>
                            <CardDescription>Pilihan Anda akan diterapkan di seluruh aplikasi.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select onValueChange={setSelectedYear} value={selectedYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tahun..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicYears.map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button className="w-full" onClick={handleContinue} disabled={!selectedYear}>
                                Lanjutkan
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
