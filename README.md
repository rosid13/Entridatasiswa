
# Dokumentasi Aplikasi: Sistem Manajemen Data Siswa - SMP Sunan Al-Anbiya Taman

## 1. Gambaran Umum Aplikasi

### Tujuan Utama
Aplikasi ini dirancang sebagai platform terpusat untuk mengelola data siswa SMP Sunan Al-Anbiya Taman secara efisien, modern, dan aman. Tujuannya adalah untuk menggantikan pencatatan manual, mengurangi kesalahan, dan mempermudah akses serta pembaruan data bagi pihak yang berwenang.

### Target Pengguna
Aplikasi ini memiliki dua peran pengguna utama:
1.  **Admin:** Memiliki hak akses penuh untuk mengelola seluruh aspek aplikasi, termasuk data siswa, akun pengguna, dan pengaturan sistem seperti tahun ajaran.
2.  **User (Guru/Staf):** Memiliki hak akses terbatas untuk melihat data siswa, menambahkan data siswa baru, dan mengajukan permintaan perbaikan data. Mereka tidak dapat mengubah atau menghapus data secara langsung.

---

## 2. Fitur-Fitur Utama

### a. Otentikasi dan Manajemen Peran
- **Login:** Pengguna masuk ke sistem menggunakan email dan password yang terdaftar via Firebase Authentication.
- **Manajemen Peran:** Peran pengguna ('admin' atau 'user') disimpan dalam koleksi `userRoles` di Firestore, yang di-link melalui UID pengguna.
- **Manajemen Akun (Admin):** Admin dapat membuat akun baru untuk pengguna lain dan menetapkan peran mereka.

### b. Manajemen Tahun Ajaran
- **Seleksi Tahun Ajaran:** Setelah login, semua pengguna harus memilih tahun ajaran yang ingin mereka kelola. Semua data yang ditampilkan dan ditambahkan terikat pada tahun ajaran yang aktif. Pilihan ini disimpan di `localStorage` browser.
- **Manajemen (Admin):** Admin memiliki halaman khusus untuk menambah atau menghapus tahun ajaran yang tersedia di sistem (misal: "2024/2025").

### c. Manajemen Data Siswa (CRUD)
- **Pendaftaran Siswa Baru:** Pengguna (Admin dan User) dapat mengisi formulir pendaftaran yang komprehensif untuk menambahkan siswa baru.
- **Daftar dan Pencarian Siswa:** Data semua siswa ditampilkan dalam bentuk tabel yang interaktif, dapat dicari berdasarkan nama atau NISN.
- **Detail Siswa:** Modal menampilkan semua data siswa secara terperinci.
- **Edit Data (Admin):** Admin dapat langsung mengedit data siswa.
- **Hapus Data (Admin):** Admin dapat menghapus data siswa.

### d. Permintaan Perbaikan Data
- **Alur Pengajuan (User):** Jika pengguna 'User' menemukan kesalahan data, mereka dapat mengajukan "Permintaan Perbaikan Data".
- **Tinjauan (Admin):** Admin meninjau semua permintaan yang tertunda di halaman khusus, di mana mereka dapat menyetujui (data akan otomatis diperbarui) atau menolak permintaan.

### e. Ekspor Data ke Excel
- Pengguna dapat mengekspor daftar siswa yang ditampilkan ke dalam format file Excel (.xlsx).

---

## 3. Teknologi dan Komponen Penting

- **Framework:** **Next.js** (dengan App Router)
- **Backend & Database:** **Firebase**
    - **Firestore:** Database NoSQL untuk semua data.
    - **Firebase Authentication:** Untuk manajemen pengguna.
- **Library Komponen UI:** **ShadCN UI**
- **Styling:** **Tailwind CSS**
- **Manajemen Form:** **React Hook Form** & **Zod** untuk validasi.
- **Ekspor Data:** **XLSX**

---

## 4. Panduan Setup untuk Proyek Baru

Untuk mereplikasi aplikasi ini dengan backend Firebase baru, ikuti langkah-langkah berikut.

### a. Setup Proyek Firebase
1.  Buat proyek baru di [Firebase Console](https://console.firebase.google.com/).
2.  Aktifkan layanan berikut:
    *   **Authentication:** Aktifkan metode login **Email/Password**.
    *   **Firestore Database:** Buat database Firestore (mulai dalam mode produksi).

### b. Struktur Database Firestore
Anda perlu membuat koleksi berikut secara manual atau melalui aplikasi:

1.  **`userRoles`**
    *   **Tujuan:** Menyimpan peran setiap pengguna.
    *   **Struktur Dokumen:**
        *   *ID Dokumen:* `UID` pengguna dari Firebase Authentication.
        *   *Fields:*
            *   `email` (string): Email pengguna.
            *   `role` (string): 'admin' atau 'user'.

2.  **`availableAcademicYears`**
    *   **Tujuan:** Menyimpan daftar tahun ajaran yang tersedia untuk dipilih.
    *   **Struktur Dokumen:**
        *   *ID Dokumen:* ID unik (auto-generated).
        *   *Fields:*
            *   `year` (string): Format "YYYY/YYYY", contoh: "2024/2025".

3.  **`siswa`**
    *   **Tujuan:** Koleksi utama yang menyimpan semua data siswa.
    *   **Struktur Dokumen:** Lihat `src/types/student.ts` untuk daftar lengkap semua field yang memungkinkan. Field paling penting adalah:
        *   `tahunAjaran` (string): Tahun ajaran saat siswa didaftarkan. Ini digunakan untuk memfilter data.
        *   `fullName` (string): Nama lengkap siswa.
        *   `nisn` (string): NISN siswa.
        *   ...dan field data pribadi, alamat, serta keluarga lainnya.

4.  **`correctionRequests`**
    *   **Tujuan:** Menyimpan permintaan perbaikan data yang diajukan oleh pengguna non-admin.
    *   **Struktur Dokumen:** Lihat `src/types/correction-request.ts` untuk struktur lengkap. Field utamanya adalah:
        *   `studentId` (string): ID dokumen siswa yang datanya ingin diperbaiki.
        *   `fieldToCorrect` (string): Nama field yang salah.
        *   `newValue` (string): Nilai baru yang diusulkan.
        *   `status` (string): 'pending', 'approved', atau 'rejected'.

### c. Setup Lingkungan Lokal
1.  **Unduh Kode:** Dapatkan kode sumber aplikasi ini.
2.  **Install Dependensi:** Jalankan `npm install` di terminal.
3.  **Buat File Environment:**
    *   Buat file bernama `.env.local` di direktori utama proyek.
    *   Salin kredensial dari proyek Firebase baru Anda (Settings > Project settings > General > Your apps > Web app) ke dalam file `.env.local`:
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
        NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"
        ```
4.  **Buat Akun Admin Pertama:**
    *   Jalankan aplikasi secara lokal dengan `npm run dev`.
    *   Karena belum ada pengguna, Anda tidak bisa login.
    *   Buka Firebase Console > Authentication > Add user. Buat pengguna pertama Anda.
    *   Salin `UID` pengguna yang baru dibuat.
    *   Buka Firebase Console > Firestore Database. Buat koleksi `userRoles`, lalu buat dokumen pertama dengan ID adalah `UID` yang baru Anda salin.
    *   Di dalam dokumen tersebut, tambahkan field `email` (string) dan `role` (string) dengan nilai 'admin'.
5.  **Jalankan dan Login:** Sekarang Anda dapat login dengan akun yang baru dibuat dan Anda akan memiliki hak akses admin.
# entridatasiswa_Baru
# Entridatasiswa
# Entridatasiswa
