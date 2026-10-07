/**
 * Tizimdagi 4 ta qat'iy rol (RBAC)
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',             // Super Admin: Barcha tumanlar, mahallalar, rollar va xodimlar boshqaruvi
  DISTRICT_ADMIN = 'DISTRICT_ADMIN',       // Tuman boshlig'i / Admin: O'z tumani bo'yicha boshqaruv
  MAHALLA_OPERATOR = 'MAHALLA_OPERATOR',   // Mahalla operatori / Yetakchi: O'z mahallasi anketalarini to'ldirish
  DATA_REVIEWER = 'DATA_REVIEWER',         // Ma'lumot tekshiruvchi: Ziddiyatli va dublikat anketalarni tekshirish
}

/**
 * So'rovnoma o'tkazish shakli (So'rovnoma blankidan)
 */
export enum SurveyMethod {
  HOME_VISIT = 'HOME_VISIT', // Uyma-uy
  PHONE = 'PHONE',           // Telefon orqali
  IN_PERSON = 'IN_PERSON',   // Qabulda
  ONLINE = 'ONLINE',         // Fuqaro tomonidan onlayn to'ldirilgan
}

/**
 * Bandlik holatining asosiy kategoriyalari
 */
export enum EmploymentCategory {
  OFFICIALLY_EMPLOYED = 'OFFICIALLY_EMPLOYED',     // 2.1. Rasmiy band
  SELF_EMPLOYED = 'SELF_EMPLOYED',                 // 2.2. O'zini o'zi band qilgan
  UNOFFICIALLY_EMPLOYED = 'UNOFFICIALLY_EMPLOYED', // 2.3. Norasmiy band
  MIGRANT = 'MIGRANT',                             // 2.4. Migrant
  UNEMPLOYED = 'UNEMPLOYED',                       // 2.5. Ishsiz yosh
  NO_WISH_TO_WORK = 'NO_WISH_TO_WORK',             // 2.6. Ishlash istagi yo'q
  OTHER = 'OTHER',                                 // 2.7. Boshqa
}

/**
 * 2.3. Ishlash istagi yo'qligi sabablari
 */
export enum NoWishReason {
  CHILD_CARE = 'CHILD_CARE',         // Bola tarbiyasida
  HOUSEWIFE = 'HOUSEWIFE',           // Uy bekasi
  WEALTHY_FAMILY = 'WEALTHY_FAMILY', // O'ziga to'q oila
  APPLICANT = 'APPLICANT',           // Abituriyent
}

/**
 * 2.4. Ishsiz yoshlar uchun talab qilinadigan yo'nalishlar
 */
export enum UnemployedDirection {
  PERMANENT_JOB = 'PERMANENT_JOB',             // Doimiy ishga joylashtirish
  SUBSIDY = 'SUBSIDY',                         // Subsidiya ajratish
  VOCATIONAL_TRAINING = 'VOCATIONAL_TRAINING', // Kasb-hunarga o'qitish
  LOAN_BUSINESS = 'LOAN_BUSINESS',             // Kredit orqali tadbirkorlik
  ADDITIONAL = 'ADDITIONAL',                   // Qo'shimcha yo'nalish
}

/**
 * So'rovnoma holati (Tekshiruv navbati / Conflict Queue uchun)
 */
export enum SurveyStatus {
  APPROVED = 'APPROVED',             // Muvaffaqiyatli qabul qilingan va tasdiqlangan
  PENDING_REVIEW = 'PENDING_REVIEW', // Tekshiruv kutmoqda (JSHSHIR dublikati yoki ziddiyatli ma'lumot)
  RESOLVED = 'RESOLVED',             // Data Reviewer tomonidan tekshirilib hal qilingan
  REJECTED = 'REJECTED',             // Rad etilgan (noto'g'ri anketalar)
}

/**
 * Ma'lumot manbasi (Kelgusida Soliq tizimi bilan integratsiya uchun zamin)
 */
export enum DataSource {
  SURVEY_OPERATOR = 'SURVEY_OPERATOR', // Yetakchi / Operator so'rovnomasi
  CITIZEN_PUBLIC = 'CITIZEN_PUBLIC',   // Fuqaro ochiq portali orqali onlayn yuborilgan
  TAX_INTEGRATION = 'TAX_INTEGRATION', // Soliq qo'mitasi ma'lumotlar bazasi
  MANUAL_AUDIT = 'MANUAL_AUDIT',       // Ma'murlar tomonidan qo'lda tahrir
}

/**
 * Kelajakdagi Soliq tizimi bilan solishtirish holati
 */
export enum TaxVerificationStatus {
  NOT_VERIFIED = 'NOT_VERIFIED',           // Hali tekshirilmagan (Phase 1)
  VERIFIED_MATCH = 'VERIFIED_MATCH',       // Soliq ma'lumotlari bilan mos keldi
  VERIFIED_MISMATCH = 'VERIFIED_MISMATCH', // Soliq ma'lumotlari bilan ziddiyat aniqlandi
}
