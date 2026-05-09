# 🎂 Retro Birthday — Panduan Deploy Gratis

Stack: **Flask** + **Supabase Storage** (file) + **Railway** (hosting)

---

## LANGKAH 1 — Setup Supabase (tempat simpan file)

### 1.1 Buat akun
Buka https://supabase.com → Sign Up (gratis, 1GB storage)

### 1.2 Buat project baru
- Klik New project
- Isi nama project: birthday-app
- Pilih region: Singapore
- Klik Create new project, tunggu ~1 menit

### 1.3 Buat Storage Bucket
- Di sidebar klik Storage
- Klik New bucket
- Nama bucket: birthday  (harus persis ini)
- Centang Public bucket
- Klik Create bucket

### 1.4 Buat folder di dalam bucket
- Klik bucket birthday
- Klik New folder, nama: music
- Klik New folder lagi, nama: photos

### 1.5 Set RLS Policy
- Masuk ke bucket birthday, klik tab Policies
- Klik New policy > For full customization
- Policy name: allow all
- Allowed operation: centang semua
- USING expression: true
- WITH CHECK expression: true
- Klik Save policy

### 1.6 Ambil kredensial
- Project Settings > API
- Salin Project URL  -> SUPABASE_URL
- Salin anon public key -> SUPABASE_KEY

---

## LANGKAH 2 — Upload kode ke GitHub

  git init
  git add .
  git commit -m "first commit"
  git remote add origin https://github.com/USERNAME/birthday-app.git
  git push -u origin main

---

## LANGKAH 3 — Deploy ke Railway

1. Buka https://railway.app, login with GitHub
2. New Project > Deploy from GitHub repo > pilih birthday-app
3. Klik tab Variables, tambahkan:
   - SUPABASE_URL = https://xxxxxxxxxx.supabase.co
   - SUPABASE_KEY = eyJhbGciOiJIUzI1NiIs...
   - SECRET_KEY   = random-string-bebas
4. Railway akan auto-build dan deploy
5. Settings > Domains > Generate Domain
   Dapat URL: https://birthday-app-xxx.up.railway.app

---

## Hasil Akhir

  /       -> Pengirim (upload foto & lagu)
  /view   -> Penerima (hanya lihat & putar musik)

File tersimpan PERMANEN di Supabase, tidak hilang saat server restart.
