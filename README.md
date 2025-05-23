# MLBB Kapolresta Sorong Kota Cup Website

Website untuk turnamen Mobile Legends: Bang Bang Kapolresta Sorong Kota Cup.

## Fitur

- Halaman beranda dengan informasi turnamen
- Halaman tim dengan detail tim dan pemain
- Halaman jadwal pertandingan
- Halaman klasemen dan bracket playoff
- Halaman pendaftaran tim dan pemain
- Integrasi dengan Firebase untuk penyimpanan data

## Struktur Proyek

```
MLBB/
├── index.html              # Halaman beranda
├── teams.html              # Halaman tim
├── schedule.html           # Halaman jadwal
├── standings.html          # Halaman klasemen
├── registration.html       # Halaman pendaftaran
├── css/
│   └── style.css           # File CSS utama
├── js/
│   ├── firebase-config.js  # Konfigurasi Firebase
│   └── main.js             # JavaScript utama
└── images/                 # Folder gambar
    ├── placeholder.svg     # Placeholder gambar
    ├── team1.svg           # Logo tim 1
    ├── team2.svg           # Logo tim 2
    ├── team3.svg           # Logo tim 3
    ├── team4.svg           # Logo tim 4
    ├── hero-bg.svg         # Background hero section
    ├── tournament-logo.svg # Logo turnamen
    ├── player-placeholder.svg # Placeholder pemain
    ├── schedule-icon.svg   # Ikon jadwal
    ├── standings-icon.svg  # Ikon klasemen
    ├── registration-icon.svg # Ikon pendaftaran
    ├── teams-icon.svg      # Ikon tim
    ├── about-icon.svg      # Ikon tentang
    ├── footer-logo.svg     # Logo footer
    └── social-icons.svg    # Ikon sosial media
```

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript
- Firebase (Firestore Database)

## Cara Menjalankan

1. Pastikan Anda memiliki koneksi internet untuk mengakses Firebase
2. Buka file `index.html` di browser
3. Atau gunakan server lokal seperti Live Server di Visual Studio Code

## Pengembangan

Untuk mengembangkan proyek ini:

1. Clone repositori
2. Buat proyek Firebase baru dan dapatkan konfigurasi
3. Update file `firebase-config.js` dengan konfigurasi Firebase Anda
4. Mulai pengembangan

## Lisensi

Hak Cipta © 2023 MLBB Kapolresta Sorong Kota Cup