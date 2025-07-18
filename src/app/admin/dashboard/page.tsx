
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, logAndReportError } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAcademicYear } from '@/context/academic-year-context';

import type { AppSession } from '@/app/page';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Users, FileCheck2, LogOut, UserPlus, List, Calendar, Archive } from 'lucide-react';
import Footer from '@/components/footer';

export default function AdminDashboardPage() {
    const [session, setSession] = useState<AppSession | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [stats, setStats] = useState({ studentCount: 0, pendingRequestsCount: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    const router = useRouter();
    const { toast } = useToast();
    const { activeYear, isLoading: isYearLoading } = useAcademicYear();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userRoleRef = doc(db, "userRoles", currentUser.uid);
                const userRoleSnap = await getDoc(userRoleRef);
                const userRole = userRoleSnap.exists() ? userRoleSnap.data().role : 'user';

                if (userRole !== 'admin') {
                    toast({
                        variant: "destructive",
                        title: "Akses Ditolak",
                        description: "Halaman ini hanya untuk admin.",
                    });
                    router.push('/');
                    return;
                }
                setSession({ user: currentUser, role: userRole });
            } else {
                router.push('/login');
            }
            setPageLoading(false);
        });
        return () => unsubscribe();
    }, [router, toast]);

    useEffect(() => {
        if (!isYearLoading && !activeYear) {
          router.push('/select-year');
        }
    }, [activeYear, isYearLoading, router]);
    
    useEffect(() => {
        if (!session || !activeYear) return;

        let studentsUnsub = () => {};
        let requestsUnsub = () => {};

        const fetchStats = async () => {
            try {
                setStatsLoading(true);
                // Get student count for the active academic year
                const studentCollQuery = query(collection(db, "siswa"), where("tahunAjaran", "==", activeYear));
                const studentSnapshot = await getCountFromServer(studentCollQuery);
                
                // Get pending requests count (not year-specific)
                const requestsQuery = query(collection(db, "correctionRequests"), where("status", "==", "pending"));
                const requestsSnapshot = await getCountFromServer(requestsQuery);

                setStats({
                    studentCount: studentSnapshot.data().count,
                    pendingRequestsCount: requestsSnapshot.data().count,
                });
            } catch (error) {
                logAndReportError(error, "Error fetching stats");
                toast({ 
                    variant: "destructive", 
                    title: "Gagal Memuat Statistik",
                    description: "Tidak dapat mengambil data statistik. Periksa koneksi Anda."
                });
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();

        // Listeners for real-time updates
        const studentQuery = query(collection(db, "siswa"), where("tahunAjaran", "==", activeYear));
        studentsUnsub = onSnapshot(studentQuery, (snap) => {
             setStats(prev => ({...prev, studentCount: snap.size}));
        }, (error) => {
            logAndReportError(error, "Real-time student count failed");
        });
        requestsUnsub = onSnapshot(query(collection(db, "correctionRequests"), where("status", "==", "pending")), (snap) => {
             setStats(prev => ({...prev, pendingRequestsCount: snap.size}));
        }, (error) => {
            logAndReportError(error, "Real-time request count failed");
        });

        return () => {
            studentsUnsub();
            requestsUnsub();
        };

    }, [session, toast, activeYear]);
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Logout Berhasil", description: "Anda telah keluar dari sesi." });
            router.push('/login');
        } catch (error) {
            logAndReportError(error, "Logout failed");
            toast({ variant: "destructive", title: "Gagal Logout!", description: "Terjadi kesalahan saat keluar." });
        }
    };

    if (pageLoading || isYearLoading || !activeYear) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                 <header className="bg-card border-b sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6">
                        <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
                        <div className="flex items-center flex-wrap gap-2">
                            <Button variant="outline" onClick={() => router.push('/select-year')}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Ubah Tahun Ajaran
                            </Button>
                            <Button variant="outline" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
                    {/* Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Siswa ({activeYear})</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-20" />
                                ) : (
                                    <div className="text-4xl font-bold">{stats.studentCount}</div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Jumlah siswa di tahun ajaran ini</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Permintaan Tertunda</CardTitle>
                                <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-20" />
                                ) : (
                                    <div className="text-4xl font-bold">{stats.pendingRequestsCount}</div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Permintaan perbaikan data butuh tinjauan</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Navigation and Admin Actions */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Manajemen & Navigasi</CardTitle>
                                <CardDescription>Akses cepat ke halaman manajemen utama.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Link href="/" passHref>
                                    <Button className="w-full" variant="outline"><List className="mr-2 h-4 w-4"/> Kelola Data Siswa</Button>
                                </Link>
                                <Link href="/requests" passHref>
                                    <Button className="w-full"><FileCheck2 className="mr-2 h-4 w-4"/> Tinjau Permintaan</Button>
                                </Link>
                                <Link href="/admin/users" passHref>
                                    <Button className="w-full" ><UserPlus className="mr-2 h-4 w-4"/> Manajemen Pengguna</Button>
                                </Link>
                                <Link href="/admin/academic-years" passHref>
                                    <Button className="w-full" ><Archive className="mr-2 h-4 w-4"/> Manajemen Tahun Ajaran</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
