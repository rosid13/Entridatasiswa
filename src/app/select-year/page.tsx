
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';

import { useAcademicYear } from '@/context/academic-year-context';
import { auth, db, logAndReportError } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar } from 'lucide-react';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function SelectYearPage() {
    const router = useRouter();
    const { setActiveYear, activeYear } = useAcademicYear();
    const [selectedYear, setSelectedYear] = useState<string>(activeYear || "");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [isLoadingYears, setIsLoadingYears] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                const userRoleRef = doc(db, "userRoles", user.uid);
                const docSnap = await getDoc(userRoleRef);
                const role = docSnap.exists() ? docSnap.data().role : 'user';
                setUserRole(role);
                setIsCheckingAuth(false);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const fetchYears = async () => {
            setIsLoadingYears(true);
            try {
                const yearsCollection = collection(db, "availableAcademicYears");
                const q = query(yearsCollection, orderBy("year", "desc"));
                const querySnapshot = await getDocs(q);
                const years = querySnapshot.docs.map(doc => doc.data().year as string);
                setAvailableYears(years);
                if (years.length > 0 && !activeYear) {
                    setSelectedYear(years[0]);
                }
            } catch (error) {
                logAndReportError(error, "Error fetching academic years");
                toast({
                    variant: "destructive",
                    title: "Gagal Memuat Tahun Ajaran",
                    description: "Tidak dapat mengambil daftar tahun ajaran. Silakan coba lagi.",
                });
            } finally {
                setIsLoadingYears(false);
            }
        };
        fetchYears();
    }, [toast, activeYear]);


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
        
        if (userRole === 'admin') {
            router.push('/admin/dashboard');
        } else {
            router.push('/');
        }
    };

    if (isCheckingAuth || isLoadingYears) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
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
                             {availableYears.length > 0 ? (
                                <>
                                    <Select onValueChange={setSelectedYear} value={selectedYear}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tahun..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableYears.map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button className="w-full" onClick={handleContinue} disabled={!selectedYear}>
                                        Lanjutkan
                                    </Button>
                                </>
                             ) : (
                                <div className='text-center text-muted-foreground text-sm space-y-4'>
                                    <p>
                                    {userRole === 'admin' 
                                        ? "Belum ada tahun ajaran yang ditambahkan. Silakan tambahkan satu untuk melanjutkan."
                                        : "Tidak ada tahun ajaran yang tersedia. Harap hubungi admin."
                                    }
                                    </p>
                                    {userRole === 'admin' && (
                                        <Link href="/admin/academic-years" passHref>
                                            <Button className='w-full'>Buka Manajemen Tahun Ajaran</Button>
                                        </Link>
                                    )}
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
