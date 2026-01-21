# Pindad Virtual Assistant - Panduan Instalasi & Penggunaan

Dokumentasi ini mencakup panduan lengkap mulai dari persiapan sistem, instalasi, konfigurasi, hingga deployment untuk sisi Frontend aplikasi Chatbot Pindad.

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah terinstal software berikut:

1.  **Node.js**: Versi 18.0.0 atau lebih baru.
    *   [Download Node.js](https://nodejs.org/)
    *   Cek versi: `node -v`
2.  **Git**: Untuk mengelola repositori kode.
    *   [Download Git](https://git-scm.com/)
3.  **Backend Server**: Aplikasi ini membutuhkan server Backend Python yang berjalan di port `8000`.

---

## 🚀 Instalasi

Ikuti langkah-langkah berikut untuk menginstal aplikasi di komputer lokal Anda.

### 1. Clone Repositori
Buka terminal (Command Prompt/PowerShell) dan jalankan perintah berikut:

```bash
git clone https://github.com/deklyjunior/PindadChatBotFE.git
cd PindadChatBotFE
```

### 2. Instalasi Dependensi
Instal semua pustaka (library) yang dibutuhkan oleh proyek ini menggunakan `npm`:

```bash
npm install
```

---

## ⚙️ Konfigurasi

### Koneksi Backend
Secara default, aplikasi dikonfigurasi untuk terhubung ke backend lokal pada alamat `http://127.0.0.1:8000`.

Konfigurasi ini diatur melalui **Proxy** di file `vite.config.js` untuk menghindari masalah CORS selama pengembangan:

```javascript
// vite.config.js
server: {
  proxy: {
    '/divisions': 'http://127.0.0.1:8000',
    '/admin': 'http://127.0.0.1:8000',
    // ... endpoint lainnya
  },
}
```

### Variabel Lingkungan (Opsional)
Jika Anda ingin mengubah URL API untuk produksi, Anda dapat membuat file `.env` di root folder:

```env
VITE_API_URL=http://api-backend-anda.com
```

---

## ▶️ Menjalankan Aplikasi

### Mode Pengembangan (Development)
Untuk menjalankan aplikasi dalam mode pengembangan dengan fitur *Hot Reload* (perubahan kode langsung terlihat):

```bash
npm run dev
```

*   Akses aplikasi melalui browser di: `http://localhost:5173`
*   Pastikan backend Anda sudah berjalan di `http://localhost:8000`.

### Mode Produksi (Build)
Untuk membuild aplikasi agar siap di-deploy ke server produksi:

```bash
npm run build
```

Hasil build akan tersimpan di dalam folder `dist/`.

Untuk mencoba hasil build secara lokal:
```bash
npm run preview
```

---

## 🛠️ Panduan Backend (Penting)

Meskipun repositori ini hanya berisi Frontend, sistem tidak akan berjalan tanpa Backend yang sesuai. Pastikan Backend Anda memenuhi kriteria berikut:

1.  **Port Server**: Berjalan di port `8000`.
2.  **Folder Data**: Pastikan server backend memiliki folder `data/` untuk menyimpan file PDF yang diupload, agar fitur download berfungsi.
3.  **Endpoint API Wajib**:
    *   `GET /divisions` - Mengambil daftar divisi
    *   `GET /faqs` - Mengambil daftar FAQ/Dokumen
    *   `GET /stats` - Mengambil statistik
    *   `POST /upload/{division_id}` - Upload PDF
    *   `GET /admin/download/pdf/{filename}` - Download PDF

---

## ❓ Troubleshooting

**Masalah: "Network Error" atau Data tidak muncul**
*   **Solusi**: Cek apakah server backend Python sudah menyala. Pastikan bisa diakses via `http://127.0.0.1:8000/stats`.

**Masalah: "Download Gagal (404)"**
*   **Solusi**: Ini sering terjadi jika file fisik PDF tidak tersimpan di folder `data/` pada server backend saat upload. Periksa log server backend Anda.

**Masalah: "Lint Error" saat build**
*   **Solusi**: Jalankan `npm run lint` untuk melihat detail error kode. Perbaiki error tersebut sebelum melakukan build ulang.

---

## 🌐 Deployment

Untuk men-deploy aplikasi ini ke internet (misal: Vercel, Netlify, atau VPS):

1.  Jalankan perintah `npm run build`.
2.  Upload seluruh isi folder `dist/` ke server hosting Anda.
3.  **Catatan**: Karena ini adalah *Single Page Application (SPA)*, pastikan konfigurasi server (Nginx/Apache) mengarahkan semua request 404 kembali ke `index.html`.
