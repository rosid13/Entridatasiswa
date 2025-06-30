
export default function Footer() {
  return (
    <footer className="w-full text-center p-4 mt-auto text-sm text-muted-foreground bg-background border-t">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-1">
        <span>© 2025 SMP SUNAN AL-ANBIYA TAMAN. All Rights Reserved.</span>
        <span className="hidden sm:inline-block">•</span>
        <span>Dibuat oleh: Rosid H.A.</span>
        <span className="hidden sm:inline-block">•</span>
        <span>Versi: 1.0.0</span>
      </div>
    </footer>
  );
}
