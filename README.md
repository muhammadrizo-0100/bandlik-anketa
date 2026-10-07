# 🇺🇿 Yoshlar Bandlik Monitoring Platformasi (Davlatobod Tumani)
## O'zbekiston yoshlarining bandlik holatini raqamli yig'ish, tasniflash va statistik tahlil qilish axborot tizimi (MVP)

Ushbu platforma O'zbekiston Respublikasi yoshlarining bandlik holatini uyma-uy yurib o'rganish, so'rovnomalarni kiritish, bandlik toifalarini shartli (conditional) tasniflash, ziddiyatli holatlarni nazorat qilish (Conflict Queue) hamda tuman rahbariyati va tahlilchilar uchun real vaqtda tezkor statistik dashboard va hisobotlarni taqdim etish uchun ishlab chiqilgan.

---

## 🛠 Texnologiyalar steki (Tech Stack)

- **Backend:** [Nest.js](https://nestjs.com/) (TypeScript)
- **Database:** [PostgreSQL 16](https://www.postgresql.org/)
- **ORM:** [TypeORM](https://typeorm.io/)
- **Xavfsizlik & Auth:** JWT (Passport.js), Bcrypt, Role-based Access Control (RBAC) Guardlari
- **Validatsiya:** `class-validator`, `class-transformer` (JSHSHIR 14 ta raqam, toifaga bog'liq shartli maydonlar)
- **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/), Lucide Icons, Jobify form dizayni
- **Diagrammalar:** [Recharts](https://recharts.org/) (Doughnut chart, Bar chart, tahliliy grafiklar)
- **Infratuzilma:** Docker & Docker Compose (`BANDLIK-AGENTLIGI` PostgreSQL konteyneri)

---

## 👥 Foydalanuvchilar va 4 ta Qat'iy Rol (RBAC)

> **DIQQAT:** Fuqarolar tizimdan o'zlari ro'yxatdan o'tmaydi. Tizim faqat davlat organi xodimlari uchun mo'ljallangan:

1. **Super Admin (`SUPER_ADMIN`):** Tizim sozlamalari, tumanlar, mahallalar qo'shish va xodimlarni boshqarish.
2. **District Admin (`DISTRICT_ADMIN`):** Tuman bo'yicha barcha statistika, anketalar, fuqarolar ro'yxati va filtrlarni boshqarish.
3. **Mahalla Operator / Yetakchi (`MAHALLA_OPERATOR`):** O'ziga biriktirilgan mahalla yoshlarini ko'radi, uyma-uy yurib so'rovnomalarni to'ldiradi va tahrirlaydi.
4. **Data Reviewer (`DATA_REVIEWER`):** Ziddiyatli/dublikat JSHSHIR holatiga tushgan anketalarni tekshirib tasdiqlaydi yoki rad etadi.

---

## 📝 Asosiy Biznes Mantiq va So'rovnoma Qoidalari

### 1. Shartli Validatsiya (Conditional Validation):
- **Majburiy maydonlar:** Tuman, Mahalla, O'rganish shakli (`HOME_VISIT`, `PHONE`, `IN_PERSON`), F.I.Sh., Tug'ilgan sana, JSHSHIR (aniq 14 ta raqam), Yashash manzili, Ta'lim muassasasi.
- **Ixtiyoriy maydonlar:** Fuqaro telefoni, Ota-onasi telefoni, Mutaxassisligi.
- **Bandlik holati (qat'iy bittasi):**
  - **Rasmiy band:** Ish joyi va lavozimi (*majburiy*).
  - **Norasmiy band:** Faoliyat turi (*majburiy*).
  - **Ishlash istagi yo'q:** Sababi (*Bola tarbiyasida, Uy bekasi, O'ziga to'q, Abituriyent*).
  - **Ishsiz:** Bandlik yo'nalishlari (*Doimiy ish, Kasb-hunarga o'qish, Imtiyozli kredit, Subsidiya, Qo'shimcha*) va izoh.
  - **Boshqa:** Aniq izoh (*majburiy*).

### 2. Tarix (Employment History) qoidasi:
Fuqaroning bandlik holati yangilanganda avvalgi holati o'chirilmaydi. `employment_history` jadvalida o'zgartirgan xodim, sana va sababi bilan arxivlanadi.

### 3. Ziddiyatlar navbati (Conflict Queue):
Agar kiritilayotgan JSHSHIR tizimda avval kiritilgan bo'lib, ziddiyat paydo qilsa, so'rovnoma to'g'ridan-to'g'ri qabul qilinmaydi, u Data Reviewer uchun `PENDING_REVIEW` holatiga o'tadi.

### 4. Soliq integratsiyasiga tayyorgarlik:
Ma'lumotlar modeli `dataSource` (`MANUAL_ENTRY`, `TAX_COMMITTEE`, `HYBRID`) va `taxVerificationStatus` maydonlari bilan keyingi bosqich integratsiyasiga to'liq tayyorlangan.

---

## 🚀 Ishga tushirish bo'yicha ko'rsatmalar

### 1. Muhit parametrlarini sozlash (.env)
Loyihani ishga tushirishdan oldin backend va frontend papkalarida `.env` fayllarini yarating:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Kerakli ma'lumotlar bazasi va xavfsizlik kalitlarini `.env` faylida ko'rsating.

### 2. Ma'lumotlar bazasi (PostgreSQL Docker)
```bash
docker compose up postgres -d
```

### 3. Backend (Nest.js)
```bash
cd backend
npm install
npm run start:dev
```
- API manzil: `http://localhost:3000/api/v1`
- Swagger interaktiv hujjatlari: `http://localhost:3000/api/v1/docs`

### 4. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web interfeys: `http://localhost:5173`

---

## 📊 Asosiy API yo'llari

| Modul | Method | Yo'nalish | Tavsif | Ruxsat |
|---|---|---|---|---|
| **Auth** | POST | `/api/v1/auth/login` | Xodimlar uchun JWT login | Hamma |
| **Auth** | GET | `/api/v1/auth/me` | Joriy profil ma'lumotlari | Auth |
| **Dashboard** | GET | `/api/v1/dashboard/summary` | KPI kartalar, taqsimot, mahalla jadvali | Barcha xodimlar |
| **Dashboard** | GET | `/api/v1/dashboard/unemployed` | Ishsizlar toifasi bo'yicha batafsil tahlil | Barcha xodimlar |
| **Citizens** | GET | `/api/v1/citizens` | Fuqarolar ro'yxati (mahalla filtri bilan) | Operator, Adminlar |
| **Citizens** | GET | `/api/v1/citizens/check-pinfl/:pinfl` | JSHSHIR bo'yicha tekshirish | Operator, Adminlar |
| **Citizens** | GET | `/api/v1/citizens/:id` | Fuqaro kartasi va bandlik tarixi | Operator, Adminlar |
| **Surveys** | POST | `/api/v1/surveys` | Yangi anketa yuborish (Conditional DTO) | Mahalla Operatori |
| **Surveys** | GET | `/api/v1/surveys` | So'rovnomalar arxivi | Operator, Adminlar |
| **Review Queue** | GET | `/api/v1/review-queue` | Ziddiyatli anketalar ro'yxati | Data Reviewer, Admin |
| **Review Queue** | POST | `/api/v1/review-queue/:id/resolve` | Anketani tasdiqlash yoki rad etish | Data Reviewer, Super Admin |
| **Mahallas** | GET/POST | `/api/v1/mahallas` | Mahallalar ro'yxati va yangisini qo'shish | Super Admin |
| **Users** | GET/POST | `/api/v1/users` | Xodimlarni boshqarish va yangi yaratish | Super Admin |
