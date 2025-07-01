
"use client";

import { useState, useEffect, useCallback } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, getDocs, doc, setDoc, getDoc, updateDoc, orderBy } from 'firebase/firestore';

import { db, auth, logAndReportError } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { AppSession } from '@/app/page';
import { useAcademicYear } from '@/context/academic-year-context';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import Footer from '@/components/footer';

interface ManagedUser {
    id: string;
    email: string;
    role: 'user' | 'admin';
}

const registerFormSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(6, { message: "Password minimal 6 karakter." }),
});

export default function UserManagementPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const [session, setSession] = useState<AppSession | null>(null);
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    
    const router = useRouter();
    const { toast } = useToast();
    const { activeYear, isLoading: isYearLoading } = useAcademicYear();

    const form = useForm<z.infer<typeof registerFormSchema>>({
        resolver: zodResolver(registerFormSchema),
        defaultValues: {
          email: "",
          password: "",
        },
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userRoleRef = doc(db, "userRoles", currentUser.uid);
                const docSnap = await getDoc(userRoleRef);
                const userRole = docSnap.exists() ? docSnap.data().role : 'user';

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

    const fetchUsers = useCallback(async () => {
        if (session?.role !== 'admin') return;
        setUsersLoading(true);
        try {
            const q = query(collection(db, "userRoles"), orderBy("email"));
            const querySnapshot = await getDocs(q);
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ManagedUser));
            setUsers(usersData);
        } catch (error) {
            logAndReportError(error, "Error fetching users");
            toast({ 
                variant: "destructive", 
                title: "Gagal Memuat Pengguna",
                description: "Tidak dapat mengambil daftar pengguna. Periksa koneksi Anda.",
            });
        } finally {
            setUsersLoading(false);
        }
    }, [session, toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    async function onRegisterSubmit(values: z.infer<typeof registerFormSchema>) {
        setIsRegistering(true);
        try {
            const { user } = await createUserWithEmailAndPassword(auth, values.email, values.password);
            
            await setDoc(doc(db, "userRoles", user.uid), {
                email: values.email,
                role: "user",
            });

            toast({
                title: "Pendaftaran Berhasil",
                description: `Pengguna baru dengan email ${values.email} telah dibuat.`,
            });
            form.reset();
            fetchUsers(); 
        } catch (error: any) {
            logAndReportError(error, "Error registering user");
            const message = error.code === 'auth/email-already-in-use' 
                ? 'Email ini sudah terdaftar.' 
                : 'Gagal mendaftarkan pengguna.';
            toast({
                variant: "destructive",
                title: "Pendaftaran Gagal",
                description: message,
            });
        } finally {
            setIsRegistering(false);
        }
    }

    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
        try {
            const userRoleRef = doc(db, "userRoles", userId);
            await updateDoc(userRoleRef, { role: newRole });
            toast({
                title: "Peran Diperbarui",
                description: `Peran pengguna telah berhasil diubah menjadi ${newRole}.`
            });
            fetchUsers(); 
        } catch (error) {
            logAndReportError(error, "Error updating role");
            toast({
                variant: "destructive",
                title: "Gagal Memperbarui Peran",
                description: "Terjadi kesalahan saat mengubah peran pengguna."
            });
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
                <header className="bg-card/70 backdrop-blur-md border-b sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto flex items-center gap-4 p-4 sm:p-6">
                        <Link href="/admin/dashboard" passHref>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary via-fuchsia-500 to-secondary bg-clip-text text-transparent drop-shadow-sm">Manajemen Pengguna</h1>
                            <p className="text-muted-foreground mt-2">Daftarkan pengguna baru dan kelola peran mereka.</p>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <Card>
                                 <CardHeader>
                                    <CardTitle>Daftarkan Pengguna Baru</CardTitle>
                                    <CardDescription>Buat akun baru untuk pengguna.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onRegisterSubmit)} className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email Pengguna</FormLabel>
                                                        <FormControl>
                                                        <Input type="email" placeholder="email@contoh.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Password</FormLabel>
                                                        <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full" disabled={isRegistering}>
                                                {isRegistering ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mendaftarkan...</>
                                                ) : (
                                                    <><UserPlus className="mr-2 h-4 w-4" /> Daftarkan Pengguna</>
                                                )}
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Daftar Pengguna</CardTitle>
                                    <CardDescription>
                                        Berikut adalah daftar semua pengguna yang terdaftar di sistem.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {usersLoading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : users.length > 0 ? (
                                        <div className="border rounded-md overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Peran</TableHead>
                                                        <TableHead className="text-right">Aksi</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {users.map((user) => (
                                                        <TableRow key={user.id}>
                                                            <TableCell className="font-medium break-all">{user.email}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                                    {user.role}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Select
                                                                    value={user.role}
                                                                    onValueChange={(value: 'user' | 'admin') => handleRoleChange(user.id, value)}
                                                                    disabled={user.id === session?.user.uid}
                                                                >
                                                                    <SelectTrigger className="w-[120px]">
                                                                        <SelectValue placeholder="Ubah Peran" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="user">User</SelectItem>
                                                                        <SelectItem value="admin">Admin</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            Tidak ada pengguna yang terdaftar.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
