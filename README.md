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
- **Login:** Pengguna masuk ke sistem menggunakan email dan password yang terdaftar.
- **Manajemen Pengguna (Admin):** Admin dapat membuat akun baru untuk pengguna lain dan menetapkan peran mereka (`admin` atau `user`).
- **Keamanan:** Sistem menggunakan Firebase Authentication untuk mengelola sesi dan keamanan akun.

### b. Manajemen Tahun Ajaran
- **Seleksi Tahun Ajaran:** Setelah login, semua pengguna harus memilih tahun ajaran yang ingin mereka kelola. Semua data yang ditampilkan dan ditambahkan akan terikat pada tahun ajaran yang aktif.
- **Manajemen (Admin):** Admin memiliki halaman khusus untuk menambah atau menghapus tahun ajaran yang tersedia di sistem (misal: "2024/2025", "2025/2026").

### c. Manajemen Data Siswa (CRUD)
- **Pendaftaran Siswa Baru:** Pengguna (Admin dan User) dapat mengisi formulir pendaftaran yang komprehensif untuk menambahkan siswa baru. Formulir ini mencakup informasi pribadi, alamat, data orang tua/wali, dan data pendukung lainnya.
- **Daftar dan Pencarian Siswa:** Data semua siswa ditampilkan dalam bentuk tabel yang interaktif. Pengguna dapat mencari siswa berdasarkan nama atau NISN.
- **Detail Siswa:** Dengan mengklik nama siswa pada tabel, sebuah modal akan muncul menampilkan semua data siswa secara terperinci dan terorganisir.
- **Edit Data (Admin):** Admin dapat langsung mengedit data siswa melalui formulir yang sama dengan formulir pendaftaran.
- **Hapus Data (Admin):** Admin memiliki kewenangan untuk menghapus data siswa secara permanen dari sistem.

### d. Permintaan Perbaikan Data
- **Alur Pengajuan (User):** Jika pengguna dengan peran `User` menemukan kesalahan data, mereka tidak bisa mengeditnya langsung. Sebagai gantinya, mereka dapat mengajukan "Permintaan Perbaikan Data" melalui modal detail siswa. Mereka memilih bidang yang salah, memasukkan nilai yang benar, dan memberikan alasan perbaikan.
- **Tinjauan (Admin):** Admin akan menerima notifikasi dan dapat meninjau semua permintaan yang tertunda di halaman khusus. Admin dapat menyetujui (data akan otomatis diperbarui) atau menolak permintaan tersebut.

### e. Ekspor Data ke Excel
- Pengguna dapat mengekspor daftar siswa yang ditampilkan (termasuk hasil pencarian) ke dalam format file Excel (.xlsx). File ini berisi semua kolom data siswa dan diformat secara rapi untuk keperluan laporan.

---

## 3. Desain Antarmuka (UI) dan Pengalaman Pengguna (UX)

### Desain Visual
- **Palet Warna:** Desain aplikasi mengusung tema modern dengan kombinasi warna **putih, merah, dan biru**. Latar belakang kartu dan formulir berwarna putih untuk kontras maksimal, merah digunakan sebagai aksen utama untuk tombol aksi penting, dan biru sebagai aksen sekunder.
- **Latar Belakang (Background):** Sebuah gambar latar belakang abstrak dinamis dengan nuansa ungu, magenta, dan biru digunakan di seluruh aplikasi untuk memberikan tampilan yang hidup dan modern.
- **Tipografi:** Menggunakan font **'Inter'**, yang dikenal bersih dan sangat mudah dibaca untuk semua teks, dari judul hingga label formulir.
- **Ikon:** Menggunakan ikon dari *library* **Lucide React** untuk memberikan visual yang konsisten dan bersih di seluruh aplikasi.

### Pengalaman Pengguna
- **Tata Letak Konsisten:** Aplikasi menggunakan tata letak yang konsisten dengan header dan footer yang jelas. Konten utama disajikan dalam bentuk kartu (*cards*) dengan sudut membulat dan bayangan halus, memberikan kesan "melayang" dan modern.
- **Navigasi Intuitif:** Alur navigasi dirancang agar mudah diikuti. Admin memiliki dashboard sebagai pusat kendali, sementara pengguna lain langsung diarahkan ke daftar siswa.
- **Formulir Terstruktur:** Formulir pendaftaran siswa dibagi menjadi beberapa bagian logis (Informasi Pribadi, Alamat, Data Keluarga, dll.) menggunakan *tabs* dan *cards* untuk mencegah pengguna merasa kewalahan.
- **Responsif:** Desain dirancang agar dapat diakses dengan baik di berbagai ukuran layar.

### Komponen UI Penting
- **Formulir:** Menggunakan komponen dari **ShadCN UI** seperti `Input`, `Select`, `Textarea`, dan `Calendar` (untuk Date Picker). Validasi *real-time* disediakan untuk memandu pengguna.
- **Tabel:** Tabel data siswa yang interaktif, memungkinkan pencarian dan pengurutan (jika diimplementasikan).
- **Modal/Dialog:** Digunakan secara ekstensif untuk menampilkan detail data, formulir permintaan perbaikan, dan dialog konfirmasi (seperti saat menghapus data).

---

## 4. Teknologi dan Komponen Penting

- **Framework:** **Next.js** (dengan App Router) digunakan sebagai framework utama, memungkinkan rendering sisi server (SSR) dan pembuatan aplikasi web yang cepat dan modern.
- **Backend & Database:** **Firebase** menjadi tulang punggung aplikasi, dengan:
    - **Firestore:** Sebagai database NoSQL untuk menyimpan semua data (siswa, pengguna, permintaan perbaikan).
    - **Firebase Authentication:** Untuk mengelola otentikasi pengguna (login, registrasi, sesi).
- **Library Komponen UI:** **ShadCN UI**, yang menyediakan koleksi komponen React yang dapat disesuaikan dan dapat diakses, dibangun di atas Tailwind CSS.
- **Styling:** **Tailwind CSS** digunakan untuk styling, memungkinkan pengembangan antarmuka yang cepat dengan pendekatan *utility-first*. Tema warna dan font disesuaikan secara global di `src/app/globals.css`.
- **Manajemen Form:**
    - **React Hook Form:** Untuk mengelola state formulir secara efisien.
    - **Zod:** Untuk validasi skema data formulir, memastikan data yang masuk sesuai format yang diharapkan.
- **Ekspor Data:** *Library* **XLSX** digunakan untuk fungsionalitas ekspor data ke file Excel.
