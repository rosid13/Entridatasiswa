
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, logAndReportError } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, GraduationCap } from "lucide-react";
import Footer from '@/components/footer';

const formSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(6, { message: "Password minimal 6 karakter." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, redirect to year selection page.
        // That page will handle role-based redirection.
        router.push('/select-year');
      } else {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login Berhasil!",
        description: "Anda akan diarahkan untuk memilih tahun ajaran.",
      });
      // The onAuthStateChanged listener will handle redirection.
    } catch (error: any) {
      logAndReportError(error, "Login failed");
      const message = error.code === 'auth/invalid-credential' 
          ? "Email atau password salah. Silakan coba lagi."
          : "Terjadi kesalahan saat login. Silakan coba lagi.";
      toast({
        variant: "destructive",
        title: "Login Gagal!",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isCheckingAuth) {
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
                <div className="text-center bg-card/70 backdrop-blur-md p-8 rounded-lg border border-white/20 shadow-lg">
                    <GraduationCap className="mx-auto h-12 w-12 text-primary mb-4" />
                    <h1 className="flex flex-col items-center text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
                        <span>SMP SUNAN AL-ANBIYA</span>
                        <span className="-mt-2">TAMAN</span>
                    </h1>
                    <p className="mt-4 text-muted-foreground">
                    Sistem Manajemen Data Siswa
                    </p>
                </div>
                <Card>
                    <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Selamat Datang</CardTitle>
                    <CardDescription>Masuk untuk mengelola data siswa</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="contoh@email.com" {...field} />
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
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memproses...
                            </>
                            ) : (
                            "Login"
                            )}
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
            </div>
        </main>
        <Footer />
    </div>
  );
}
