# CuacaKini — Prakiraan Cuaca Indonesia 🌤️

Aplikasi web modern untuk melihat prakiraan cuaca seluruh kelurahan dan desa di Indonesia secara real-time. Dibangun menggunakan Next.js dengan antarmuka pengguna yang premium, responsif, dan sangat memperhatikan aksesibilitas.

## 🌟 Fitur Utama

- **Pencarian Lokasi Detail (Cascade Dropdown)**: Cari cuaca secara spesifik mulai dari tingkat Provinsi, Kabupaten/Kota, Kecamatan, hingga Desa/Kelurahan.
- **Prakiraan Cuaca 3 Hari**: Menampilkan detail prakiraan cuaca, suhu, kelembapan, kecepatan angin, arah angin, dan jarak pandang untuk 3 hari ke depan.
- **Desain Premium & Glassmorphism**: Tampilan modern dengan tema gelap (dark mode), efek *glassmorphism*, dan animasi transisi yang halus.
- **Mobile Responsive**: Tampilan dioptimalkan untuk berjalan sempurna di berbagai ukuran layar (HP, tablet, maupun desktop).
- **SEO Optimized**: Tag meta, sitemap, dan robots.txt yang dinamis dan diatur penuh melalui `.env` untuk mendukung indeks mesin pencari.
- **Aksesibilitas (A11y) Penuh**: Mendukung navigasi *keyboard* dan pembaca layar (*screen reader*) untuk kenyamanan semua pengguna.

## 📡 API Gratis yang Digunakan

Aplikasi ini dimungkinkan oleh adanya layanan data publik (API) gratis dari institusi berikut:

1. **[Data Terbuka BMKG](https://data.bmkg.go.id/prakiraan-cuaca/)** 
   - Sumber utama data prakiraan cuaca resmi. Data yang diambil mencakup informasi suhu, cuaca, kondisi angin, kelembapan, jarak pandang, hingga tutupan awan di level desa.
   
2. **[Wilayah.id API](https://wilayah.id/)**
   - API untuk mendapatkan hierarki data wilayah administrasi Indonesia secara lengkap (Provinsi ➡️ Kabupaten/Kota ➡️ Kecamatan ➡️ Desa/Kelurahan). API ini memudahkan pengguna mencari lokasi berdasarkan nama tempat dibandingkan memasukkan kode wilayah administrasi (BPS) secara manual.

> **Info Teknis**: Aplikasi ini mengandalkan Route Handlers (fitur *server-side* Next.js) sebagai **proxy** untuk melakukan *fetching* data. Ini mencegah munculnya masalah CORS (Cross-Origin Resource Sharing) yang biasa terjadi jika meminta data API eksternal langsung dari browser (client).

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **UI/UX Komponen**: `react-select` (untuk *dropdown* pencarian)
- **Styling**: Vanilla CSS Variables (Tanpa Framework CSS, sangat optimal)
- **Package Manager**: [Bun](https://bun.sh/) / NPM

## 🚀 Panduan Instalasi Lokal

1. **Clone repository ini**
   ```bash
   git clone <url-repository>
   cd predict-weather
   ```

2. **Install dependensi**
   ```bash
   npm install
   # atau jika Anda menggunakan bun:
   bun install
   ```

3. **Konfigurasi Environment Variables**
   Ganti nama template `.env.example` menjadi `.env.local` untuk mengatur variabel lokal.
   ```bash
   cp .env.example .env.local
   ```
   Di dalam file `.env.local`, Anda dapat mengubah metadata SEO, pengaturan caching, dan URL API sesuai dengan kebutuhan Anda.

4. **Jalankan Development Server**
   ```bash
   npm run dev
   # atau
   bun dev
   ```

5. **Buka di Browser**
   Kunjungi [http://localhost:3000](http://localhost:3000) pada browser Anda untuk melihat aplikasi berjalan.

## 📝 Konfigurasi `.env`

Aplikasi ini menggunakan file konfigurasi terpusat yang sangat fleksibel. Berikut beberapa variabel penting:

- `NEXT_PUBLIC_SITE_NAME`: Nama situs web (muncul di judul tab browser dan di header).
- `NEXT_PUBLIC_SITE_TAGLINE`: Slogan atau tagline utama pada halaman beranda.
- `BMKG_API_URL` & `WILAYAH_API_URL`: Endpoint layanan API eksternal.
- `WEATHER_CACHE_SECONDS` & `WILAYAH_CACHE_SECONDS`: Pengaturan masa aktif memori *cache* (Revalidation). Hal ini berguna untuk performa *loading* yang instan dan mencegah terkena blokir (*rate-limiting*) dari penyedia API.

---

*Proyek ini dibangun sebagai demonstrasi antarmuka web modern, performa tinggi, dengan aksesibilitas yang baik dalam mengolah data publik Indonesia.*
