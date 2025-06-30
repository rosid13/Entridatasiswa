
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Users, FileCheck2, LogOut, UserPlus, List } from 'lucide-react';

export default function AdminDashboardPage() {
    const [session, setSession] = useState<AppSession | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [stats, setStats] = useState({ studentCount: 0, pendingRequestsCount: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    
    const [userIdToAdmin, setUserIdToAdmin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                toast({ variant: "destructive", title: "Gagal memuat statistik." });
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();

        // Also set up listeners for real-time updates
        studentsUnsub = onSnapshot(collection(db, "siswa"), (snap) => {
             setStats(prev => ({...prev, studentCount: snap.size}));
        });
        requestsUnsub = onSnapshot(query(collection(db, "correctionRequests"), where("status", "==", "pending")), (snap) => {
             setStats(prev => ({...prev, pendingRequestsCount: snap.size}));
        });

        return () => {
            studentsUnsub();
            requestsUnsub();
        };

    }, [session, toast]);

    const handleSetAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userIdToAdmin) {
          toast({ variant: 'destructive', title: 'Gagal!', description: 'User ID tidak boleh kosong.' });
          return;
        }
        setIsSubmitting(true);
        try {
          const userRoleRef = doc(db, 'userRoles', userIdToAdmin);
          await setDoc(userRoleRef, { role: 'admin' }, { merge: true });
          toast({ title: 'Sukses!', description: `Peran untuk user ${userIdToAdmin} telah diatur menjadi admin.` });
          setUserIdToAdmin('');
        } catch (error) {
          console.error("Error setting user role: ", error);
          toast({ variant: 'destructive', title: 'Gagal!', description: 'Terjadi kesalahan saat mengatur peran user.' });
        } finally {
          setIsSubmitting(false);
        }
    };
    
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
        <main className="min-h-screen bg-secondary">
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
                <div className="grid gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Navigasi Cepat</CardTitle>
                            <CardDescription>Akses cepat ke halaman manajemen utama.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href="/" passHref>
                                <Button className="w-full" variant="outline"><List className="mr-2 h-4 w-4"/> Lihat & Kelola Data Siswa</Button>
                            </Link>
                             <Link href="/requests" passHref>
                                <Button className="w-full"><FileCheck2 className="mr-2 h-4 w-4"/> Tinjau Permintaan Perbaikan</Button>
                            </Link>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Panel Admin</CardTitle>
                            <CardDescription>Atur peran pengguna secara manual.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form onSubmit={handleSetAdmin} className="space-y-4">
                                <Label htmlFor="userId" className='font-semibold'>Jadikan Admin</Label>
                                <Input
                                    id="userId"
                                    type="text"
                                    value={userIdToAdmin}
                                    onChange={(e) => setUserIdToAdmin(e.target.value)}
                                    placeholder="Masukkan User ID dari Firebase Auth"
                                />
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                    Atur Sebagai Admin
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
