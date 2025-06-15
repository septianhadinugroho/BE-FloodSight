# FloodSight Backend

FloodSight Backend adalah API berbasis Hapi.js yang berfungsi sebagai backend untuk aplikasi FloodSight. API ini menangani otentikasi pengguna, permintaan prediksi banjir dengan mengintegrasikan model pembelajaran mesin, dan mengambil data cuaca real-time untuk wilayah JABODETABEK (Jakarta, Bogor, Depok, Tangerang, Bekasi) dari API BMKG.

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Proyek](#struktur-proyek)
- [Memulai](#memulai)
  - [Prasyarat](#prasyarat)
  - [Instalasi](#instalasi)
  - [Variabel Lingkungan](#variabel-lingkungan)
  - [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Endpoint API](#endpoint-api)
  - [Otentikasi Pengguna](#otentikasi-pengguna)
  - [Prediksi Banjir](#prediksi-banjir)
  - [Data Cuaca](#data-cuaca)
- [Model Data](#model-data)
  - [Model Pengguna](#model-pengguna)
  - [Model Prediksi](#model-prediksi)
- [Middleware](#middleware)
- [Deployment](#deployment)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## Fitur

- **Otentikasi Pengguna**: Mendaftar, masuk, dan mengelola profil pengguna dengan otentikasi berbasis JWT.
- **Prediksi Banjir**:
  - Mengirim permintaan ke model Machine Learning (ML) eksternal untuk prediksi banjir berdasarkan tahun, bulan, lintang, dan bujur.
  - Menyimpan hasil prediksi, termasuk metadata seperti `kabupaten` dan `kecamatan`, ke MongoDB.
  - Mengambil riwayat prediksi banjir untuk pengguna yang masuk.
- **Integrasi Data Cuaca**: Mengambil data cuaca terkini untuk wilayah JABODETABEK dari API BMKG.
- **CORS Diaktifkan**: Dikonfigurasi untuk mengizinkan permintaan lintas asal, cocok untuk aplikasi frontend terpisah.
- **Penanganan Error**: Penanganan error yang komprehensif untuk permintaan API dan panggilan layanan eksternal.
- **Pemformatan Data**: Memformat nama `kecamatan` untuk konsistensi.

## Teknologi yang Digunakan

- **Node.js**: Runtime JavaScript.
- **Hapi.js**: Kerangka kerja yang kaya untuk membangun aplikasi dan layanan.
- **MongoDB Atlas**: Database NoSQL yang di-host di cloud.
- **Mongoose**: Object Data Modeling (ODM) MongoDB untuk Node.js.
- **Axios**: Klien HTTP berbasis Promise untuk browser dan Node.js, digunakan untuk panggilan API eksternal (BMKG dan model ML).
- **Axios-Retry**: Middleware opsional untuk Axios untuk secara otomatis mencoba kembali permintaan yang gagal.
- **Bcrypt**: Pustaka untuk membantu mengenkripsi kata sandi.
- **jsonwebtoken (JWT)**: Digunakan untuk otentikasi pengguna yang aman.
- **Dotenv**: Memuat variabel lingkungan dari file `.env`.
- **Nodemon**: Utilitas yang memantau perubahan pada sumber Anda dan secara otomatis memulai ulang server Anda (untuk pengembangan).

## Struktur Proyek

```
.
├── .gitignore
├── index.js
├── package.json
├── package-lock.json
├── vercel.json
├── data/
│   └── jabodetabekAreas.js
├── middlewares/
│   └── auth.js
├── models/
│   ├── prediction.model.js
│   └── user.model.js
└── routes/
    ├── prediction.routes.js
    └── user.routes.js
```

### Deskripsi File dan Direktori

- `index.js`: Titik masuk utama aplikasi, bertanggung jawab untuk mengatur server Hapi, menghubungkan ke MongoDB, dan mendefinisikan rute inti.
- `data/jabodetabekAreas.js`: Berisi daftar area JABODETABEK dengan nama, kode, dan pengidentifikasi `adm4` untuk API BMKG.
- `middlewares/auth.js`: Berisi middleware `verifyToken` untuk mengautentikasi permintaan menggunakan JWT.
- `models/`: Mendefinisikan skema dan model Mongoose untuk data `User` dan `Prediction`.
- `routes/`: Berisi definisi rute terpisah untuk `user.routes.js` (otentikasi dan manajemen pengguna) dan `prediction.routes.js` (prediksi banjir dan data historis).
- `vercel.json`: Konfigurasi untuk deployment Vercel.
- `.gitignore`: Menentukan file yang sengaja tidak dilacak untuk diabaikan.
- `package.json`: Mendefinisikan metadata proyek dan dependensi.
- `package-lock.json`: Mencatat pohon dependensi yang tepat.

## Memulai

### Prasyarat

Sebelum menjalankan aplikasi, pastikan Anda memiliki:

- Node.js terinstal (versi 16.20.1 atau lebih tinggi direkomendasikan karena persyaratan Mongoose).
- Akun MongoDB Atlas dan kluster database yang telah diatur.
- Endpoint API model Machine Learning (ML) untuk prediksi banjir.

### Instalasi

1. **Kloning repositori**:
   ```bash
   git clone https://github.com/septianhadinugroho/be-floodsight.git
   cd be-floodsight
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

### Variabel Lingkungan

Buat file `.env` di direktori root proyek dan tambahkan variabel lingkungan berikut:

```env
PORT=3000
MONGO_URI="your_mongodb_connection_string"
JWT_SECRET="your_jwt_secret_key"
ML_API_URL="your_machine_learning_model_api_url"
```

#### Deskripsi Variabel

- `PORT`: Nomor port tempat server akan berjalan (misalnya, `3000`).
- `MONGO_URI`: String koneksi MongoDB Atlas Anda.
- `JWT_SECRET`: String acak yang kuat digunakan untuk menandatangani JWT.
- `ML_API_URL`: URL API model Machine Learning eksternal Anda untuk prediksi banjir.

### Menjalankan Aplikasi

**Mode Pengembangan (dengan Nodemon):**

```bash
npm start
```

Ini akan memulai server menggunakan `nodemon`, yang secara otomatis memulai ulang aplikasi saat perubahan file terdeteksi.

**Mode Produksi:**

```bash
node index.js
```

## Endpoint API

API disajikan di `http://localhost:PORT` (atau host dan port yang Anda konfigurasi).

### Otentikasi Pengguna

#### `POST /register`
Mendaftarkan pengguna baru.

**Body Permintaan:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "city": "Jakarta",
  "longitude": 106.8271,
  "latitude": -6.1751,
  "password": "securepassword123"
}
```

**Respons:** Mengembalikan objek pengguna yang terdaftar (tanpa kata sandi) dan token JWT.

#### `POST /login`
Mengotentikasi pengguna.

**Body Permintaan:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Respons:** Mengembalikan pesan sukses, objek pengguna (tanpa kata sandi), dan token JWT.

#### `GET /users`
Mengambil semua pengguna (membutuhkan otentikasi).

**Header:** `Authorization: Bearer <token>`

**Respons:** Sebuah array objek pengguna (tanpa kata sandi).

#### `GET /users/{id}`
Mengambil pengguna tertentu berdasarkan ID (membutuhkan otentikasi dan `userId` yang cocok).

**Header:** `Authorization: Bearer <token>`

**Respons:** Objek pengguna (tanpa kata sandi).

#### `PUT /users/{id}`
Memperbarui informasi pengguna (membutuhkan otentikasi dan `userId` yang cocok).

**Header:** `Authorization: Bearer <token>`

**Body Permintaan:** (Pembaruan parsial diizinkan)
```json
{
  "name": "Johnathan Doe",
  "city": "Bogor",
  "password": "newsecurepassword"
}
```

**Respons:** Objek pengguna yang diperbarui (tanpa kata sandi).

#### `DELETE /users/{id}`
Menghapus pengguna (membutuhkan otentikasi dan `userId` yang cocok).

**Header:** `Authorization: Bearer <token>`

**Respons:** Pesan sukses.

### Prediksi Banjir

#### `POST /api/predict`
Meminta prediksi banjir dari model ML dan menyimpan hasilnya.

**Header:** `Authorization: Bearer <token>`

**Body Permintaan:**
```json
{
  "tahun": 2025,
  "bulan": "Juni",
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

**Respons:** Mengembalikan `prediksi_label` (boolean yang menunjukkan prediksi banjir) dan metadata dari model ML, termasuk `kabupaten` dan `kecamatan` yang diformat.

**Validasi:** Koordinat harus berada dalam wilayah Jabodetabek (lintang antara -6.8 dan -5.9, bujur antara 106.3 dan 107.2).

#### `GET /api/predictions`
Mengambil semua riwayat prediksi banjir untuk pengguna yang terautentikasi.

**Header:** `Authorization: Bearer <token>`

**Respons:** Sebuah array objek prediksi, dengan nama `kecamatan` yang diformat.

### Data Cuaca

#### `GET /api/weather`
Mengambil data cuaca terkini untuk semua wilayah JABODETABEK dari API BMKG. Endpoint ini menangani pembatasan laju dengan memperkenalkan penundaan antar permintaan.

**Respons:** Objek yang berisi data cuaca untuk setiap area JABODETABEK, atau daftar area yang gagal dengan pesan kesalahan.

## Model Data

### Model Pengguna

Mewakili pengguna dalam sistem.

**Schema:**
- `name`: `String`, wajib, di-trim.
- `email`: `String`, wajib, unik, huruf kecil.
- `city`: `String`, opsional.
- `longitude`: `Number`, opsional.
- `latitude`: `Number`, opsional.
- `password`: `String`, wajib (disimpan sebagai hash).
- `timestamps`: Secara otomatis menambahkan bidang `createdAt` dan `updatedAt`.

### Model Prediksi

Menyimpan hasil prediksi banjir.

**Schema:**
- `userId`: `ObjectId` (mereferensikan `User`), wajib.
- `tahun`: `Number`, wajib (tahun prediksi).
- `bulan`: `String`, wajib (bulan prediksi, misal "Januari", "Februari").
- `latitude`: `Number`, wajib.
- `longitude`: `Number`, wajib.
- `prediksi_label`: `Boolean`, wajib (true jika banjir diprediksi, false jika tidak).
- `kabupaten`: `String`, wajib (nama kabupaten).
- `kecamatan`: `String`, wajib (nama kecamatan).
- `tanggal`: `Date`, default ke `Date.now` (timestamp prediksi).

## Middleware

### `verifyToken`
Middleware ini memastikan bahwa JWT yang valid ada di header `Authorization` dari permintaan. Jika token hilang atau tidak valid, ia mengembalikan respons 401 Unauthorized. Jika valid, ia mendekode token dan melampirkan `userId` ke `request.auth`.

## Deployment

Proyek ini menyertakan file `vercel.json`, yang menunjukkan bahwa proyek ini dapat di-deploy ke Vercel.

### Deploy ke Vercel

1. **Instal Vercel CLI**: 
   ```bash
   npm install -g vercel
   ```

2. **Login ke Vercel**: 
   ```bash
   vercel login
   ```

3. **Deploy**: 
   ```bash
   vercel
   ```

**Catatan:** Pastikan variabel lingkungan Anda dikonfigurasi di pengaturan proyek Vercel.

## Kontribusi

Jangan ragu untuk membuka masalah (issue) atau mengirimkan permintaan tarik (pull request).
