# Smart Attendance & Productivity Tracker

Aplikasi web full-stack berbasis **Python Flask** + **PostgreSQL** untuk pencatatan kehadiran dan monitoring produktivitas.

**Mata Kuliah:** Komputasi Awan  
**Platform Target:** PaaS (Railway.app)  
**Stack:** Flask · PostgreSQL · SQLAlchemy · Bootstrap 5 · Gunicorn  
**Author:** M.Rizki Aulia Wibowo

---

## Fitur

| Fitur | Keterangan |
|-------|-----------|
| Catat Kehadiran | Input kehadiran dengan status: Hadir, Izin, Sakit, Alpa |
| Manajemen Pengguna | Tambah & lihat pengguna (Mahasiswa / Karyawan) |
| Statistik Real-time | Persentase kehadiran, rekap status, total catatan |
| Filter Data | Filter berdasarkan tanggal dan User ID |
| Export CSV | Download seluruh data kehadiran |
| Health Check | Endpoint cek status server & koneksi database |

---

## Arsitektur

```
┌──────────────────────────────────────────────────┐
│               CLIENT (Browser)                    │
│       Bootstrap 5 UI + Vanilla JS (Fetch API)    │
└──────────────────┬───────────────────────────────┘
                   │ HTTP
                   ▼
┌──────────────────────────────────────────────────┐
│             Railway PaaS Platform                 │
│                                                   │
│   Gunicorn (WSGI)                                 │
│        │                                          │
│   Flask App                                       │
│   ├── /dashboard   (Blueprint)                    │
│   ├── /api/users   (Blueprint)                    │
│   └── /api/attendance (Blueprint)                 │
│        │                                          │
│   SQLAlchemy ORM                                  │
│        │                                          │
│   PostgreSQL Add-on (Railway managed)             │
│   ├── Table: users                                │
│   └── Table: attendance_records                   │
└──────────────────────────────────────────────────┘
```

---

## Struktur Folder

```
smart-attendance-tracker/
│
├── app.py
├── config.py
├── extensions.py
├── railway.json           ← konfigurasi deploy Railway
├── Procfile
├── runtime.txt
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
│
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── attendance.py
│
├── routes/
│   ├── __init__.py
│   ├── dashboard.py
│   ├── users.py
│   └── attendance.py
│
├── templates/
│   ├── base.html
│   ├── dashboard.html
│   └── errors/
│       ├── 404.html
│       └── 500.html
│
└── static/
    ├── css/style.css
    └── js/main.js
```

---

## Cara Jalankan Lokal

```bash
# 1. Clone repo
git clone https://github.com/username/smart-attendance-tracker.git
cd smart-attendance-tracker

# 2. Buat virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Salin file env
copy .env.example .env

# 5. Jalankan
python app.py
# Buka http://localhost:5000
```

---

## Deploy ke Railway

### 1. Push kode ke GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### 2. Buat project di Railway

1. Daftar / login ke [railway.app](https://railway.app)
2. Klik **"New Project"**
3. Pilih **"Deploy from GitHub repo"**
4. Pilih repository yang sudah di-push tadi
5. Railway akan otomatis mendeteksi Python dan mulai build

### 3. Tambah database PostgreSQL

1. Di dalam project Railway, klik **"+ New"**
2. Pilih **"Database"** → **"Add PostgreSQL"**
3. Tunggu database selesai provisioning
4. Klik database tersebut → tab **"Variables"**
5. Salin nilai `DATABASE_URL`

### 4. Set environment variables

Masuk ke service Flask kamu di Railway → tab **"Variables"**, tambahkan:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | *(paste dari PostgreSQL add-on)* |
| `SECRET_KEY` | *(string acak yang panjang)* |
| `FLASK_ENV` | `production` |

> Railway secara otomatis meng-inject `DATABASE_URL` dari PostgreSQL add-on jika service-nya berada dalam satu project. Tapi tetap konfirmasi di tab Variables.

### 5. Tunggu deploy selesai

Railway akan build ulang otomatis. Cek tab **"Deployments"** untuk melihat log.  
Setelah selesai, klik **"Visit"** untuk buka aplikasi.

### 6. Verifikasi

```bash
# Health check
curl https://nama-app.up.railway.app/health

# Test tambah user
curl -X POST https://nama-app.up.railway.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Andi", "email": "andi@test.com", "role": "mahasiswa"}'
```

---

## Dokumentasi API

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/` | Dashboard (HTML) |
| `GET` | `/health` | Cek status server dan database |
| `GET` | `/api/statistics` | Statistik kehadiran |
| `GET` | `/api/users` | Daftar pengguna |
| `POST` | `/api/users` | Tambah pengguna |
| `GET` | `/api/attendance` | Data kehadiran (bisa difilter) |
| `POST` | `/api/attendance` | Catat kehadiran |

### Contoh Request

**POST /api/users**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "M.Rizki Aulia Wibowo", "email": "rizki@student.ac.id", "role": "mahasiswa"}'
```

**POST /api/attendance**
```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "status": "Hadir", "activity_summary": "Kuliah Cloud Computing"}'
```

**GET /api/attendance?date=2024-01-15**
```bash
curl "http://localhost:5000/api/attendance?date=2024-01-15"
```

---

## Catatan Konsep Cloud (untuk Presentasi)

### Kenapa PaaS bukan IaaS?

| Aspek | PaaS (Railway) | IaaS (VPS/EC2) |
|-------|----------------|----------------|
| Pengelolaan server | Otomatis | Manual |
| Kecepatan deploy | Push = deploy | Butuh setup OS, server |
| Scaling | Otomatis | Manual |
| Cocok untuk | Mahasiswa, startup | Enterprise, kontrol penuh |

### Environment Variable
Konfigurasi sensitif seperti `DATABASE_URL` dan `SECRET_KEY` disimpan sebagai environment variable agar tidak ikut ter-commit ke GitHub. Railway menyediakannya lewat tab **Variables** di dashboard.

### PostgreSQL Add-on di Railway
Railway menyediakan managed PostgreSQL yang otomatis terhubung ke service Flask dalam satu project. Tidak perlu install atau konfigurasi database server secara manual.

---

## Troubleshooting

**Build gagal di Railway:**  
Pastikan `requirements.txt` ada dan bisa di-install. Cek log di tab Deployments.

**Database error setelah deploy:**  
Cek apakah `DATABASE_URL` sudah di-set di tab Variables. Format harus `postgresql://` bukan `postgres://` — sudah ditangani otomatis di `config.py`.

**App tidak bisa diakses:**  
Cek tab Deployments, pastikan status **"Active"**. Jika gagal build, cek log error-nya.
