
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, getCountFromServer, doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import type { AppSession } from '@/app/page';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Users, FileCheck2, LogOut, UserPlus, List } from 'lucide-react';
import Footer from '@/components/footer';

export default function AdminDashboardPage() {
    const [session, setSession] = useState<AppSession | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [stats, setStats] = useState({ studentCount: 0, pendingRequestsCount: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    const router = useRouter();
    const { toast } = useToast();

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
        if (!session) return;

        let studentsUnsub = () => {};
        let requestsUnsub = () => {};

        const fetchStats = async () => {
            try {
                setStatsLoading(true);
                // Get student count
                const studentColl = collection(db, "siswa");
                const studentSnapshot = await getCountFromServer(studentColl);
                
                // Get pending requests count
                const requestsQuery = query(collection(db, "correctionRequests"), where("status", "==", "pending"));
                const requestsSnapshot = await getCountFromServer(requestsQuery);

                setStats({
                    studentCount: studentSnapshot.data().count,
                    pendingRequestsCount: requestsSnapshot.data().count,
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
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

        // Also set up listeners for real-time updates
        studentsUnsub = onSnapshot(collection(db, "siswa"), (snap) => {
             setStats(prev => ({...prev, studentCount: snap.size}));
        }, (error) => {
            console.error("Real-time student count failed:", error);
        });
        requestsUnsub = onSnapshot(query(collection(db, "correctionRequests"), where("status", "==", "pending")), (snap) => {
             setStats(prev => ({...prev, pendingRequestsCount: snap.size}));
        }, (error) => {
            console.error("Real-time request count failed:", error);
        });

        return () => {
            studentsUnsub();
            requestsUnsub();
        };

    }, [session, toast]);
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Logout Berhasil", description: "Anda telah keluar dari sesi." });
            router.push('/login');
        } catch (error) {
            console.error("Logout failed: ", error);
            toast({ variant: "destructive", title: "Gagal Logout!", description: "Terjadi kesalahan saat keluar." });
        }
    };

    if (pageLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-secondary">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-secondary">
            <main className="flex-grow">
                 <header className="bg-background border-b">
                    <div className="max-w-7xl mx-auto flex justify-between items-center p-4 sm:p-6">
                        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
                    {/* Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? (
                                    <Skeleton className="h-8 w-20" />
                                ) : (
                                    <div className="text-4xl font-bold">{stats.studentCount}</div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Jumlah siswa yang terdaftar di sistem</p>
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
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <Link href="/" passHref>
                                    <Button className="w-full" variant="outline"><List className="mr-2 h-4 w-4"/> Kelola Data Siswa</Button>
                                </Link>
                                <Link href="/requests" passHref>
                                    <Button className="w-full"><FileCheck2 className="mr-2 h-4 w-4"/> Tinjau Permintaan</Button>
                                </Link>
                                <Link href="/admin/users" passHref>
                                    <Button className="w-full" ><UserPlus className="mr-2 h-4 w-4"/> Manajemen Pengguna</Button>
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
