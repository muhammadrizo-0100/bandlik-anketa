/**
 * O'zbekiston telefon raqamini formatlash (+998 XX XXX-XX-XX)
 */
export const formatUzPhone = (value: string): string => {
  if (!value) return '';

  // Faqat raqamlarni ajratib olish
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';

  // Agar 998 bilan boshlangan bo'lsa uni olib tashlaymiz (biz o'zimiz qo'shamiz)
  let localNumbers = numbers;
  if (localNumbers.startsWith('998')) {
    localNumbers = localNumbers.slice(3);
  }

  // Maksimal 9 ta raqam (operator kodi 2 ta + 7 ta raqam)
  localNumbers = localNumbers.slice(0, 9);

  if (localNumbers.length === 0) {
    return numbers.startsWith('9') ? '+998' : '';
  }

  let formatted = '+998';

  if (localNumbers.length <= 2) {
    return `${formatted} (${localNumbers}`;
  }

  formatted += ` (${localNumbers.slice(0, 2)}) ${localNumbers.slice(2, 5)}`;

  if (localNumbers.length > 5) {
    formatted += `-${localNumbers.slice(5, 7)}`;
  }

  if (localNumbers.length > 7) {
    formatted += `-${localNumbers.slice(7, 9)}`;
  }

  return formatted;
};

/**
 * Telefon raqami to'liq va to'g'ri kiritilganligini tekshirish
 */
export const isValidUzPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 12) return false;
  if (!digits.startsWith('998')) return false;

  const operatorCode = digits.slice(3, 5);
  // O'zbekistondagi amaldagi mobil va shahar kodlari
  const validCodes = [
    '33', '88', '90', '91', '93', '94', '95', '97', '98', '99',
    '71', '77', '50', '55', '69', '66', '62', '74', '75', '76'
  ];
  return validCodes.includes(operatorCode);
};

/**
 * Matn faqat raqamlardan iborat emasligini tekshirish (kamida bitta harf bo'lishi shart)
 */
export const hasLetters = (text: string): boolean => {
  if (!text) return false;
  // Lotin yoki Kirill harflari borligini tekshirish
  return /[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ]/.test(text.trim());
};

/**
 * F.I.Sh. to'g'ri kiritilganligini tekshirish (Kamida 2 ta so'z, faqat harflar, raqamsiz)
 */
export const isValidFullName = (name: string): boolean => {
  const trimmed = name.trim();
  if (trimmed.length < 5) return false;

  // Raqamlar bo'lmasligi kerak
  if (/\d/.test(trimmed)) return false;

  // Kamida 2 ta so'z (Ism va Familiya)
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;

  // Har bir so'zda kamida 2 ta harf bo'lsin
  return parts.every((p) => hasLetters(p) && p.length >= 2);
};

/**
 * JSHSHIR (PINFL) 14 ta raqam va standarti bo'yicha tekshirish
 */
export const isValidPinfl = (
  pinfl: string,
  birthDate?: string
): { valid: boolean; message?: string } => {
  const clean = pinfl.trim();

  if (!/^\d{14}$/.test(clean)) {
    return { valid: false, message: 'JSHSHIR qat\'iy 14 ta raqamdan iborat bo\'lishi shart' };
  }

  // Bir xil takrorlanuvchi raqamlarni rad etish (masalan: 11111111111111, 22222222222222)
  if (/^(\d)\1{13}$/.test(clean)) {
    return { valid: false, message: 'JSHSHIR takrorlanuvchi soxta raqamlardan iborat bo\'lishi mumkin emas' };
  }

  // Birinchi raqam tekshiruvi: 3, 4, 5 yoki 6 bo'lishi kerak (O'zbekiston standarti)
  const firstDigit = clean[0];
  if (!['3', '4', '5', '6'].includes(firstDigit)) {
    return {
      valid: false,
      message: 'JSHSHIRning 1-raqami 3, 4 (XX asr) yoki 5, 6 (XXI asr) bo\'lishi shart',
    };
  }

  // 2-7 raqamlar tug'ilgan sana (DDMMYY)
  const dayStr = clean.slice(1, 3);
  const monthStr = clean.slice(3, 5);
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return {
      valid: false,
      message: `JSHSHIRda tugʻilgan sana boshida yoziladi: [1-raqam (3-6)][Kun: 01-31][Oy: 01-12][Yil: 00-99]. Siz kiritgan JSHSHIRda kun=${dayStr}, oy=${monthStr} boʻlib qolgan. Sana oxirida emas, aynan 2-7 oʻrinlarda turishi kerak.`,
    };
  }

  // Agar tug'ilgan sana ko'rsatilgan bo'lsa, mosligini tekshirish
  if (birthDate) {
    const [y, m, d] = birthDate.split('-');
    const expectedDay = d;
    const expectedMonth = m;
    const expectedYear = y ? y.slice(2) : '';

    const pinflDay = clean.slice(1, 3);
    const pinflMonth = clean.slice(3, 5);
    const pinflYear = clean.slice(5, 7);

    if (pinflDay !== expectedDay || pinflMonth !== expectedMonth || pinflYear !== expectedYear) {
      return {
        valid: false,
        message: `JSHSHIRdagi sana (${pinflDay}.${pinflMonth}.${pinflYear}) kiritilgan tug'ilgan sana (${expectedDay}.${expectedMonth}.${expectedYear}) bilan mos kelmadi`,
      };
    }
  }

  return { valid: true };
};

/**
 * JSHSHIR orqali fuqaroning tug'ilgan sanasini avtomatik ajratib olish (YYYY-MM-DD)
 */
export const extractBirthDateFromPinfl = (pinfl: string): string | null => {
  const clean = pinfl.replace(/\D/g, '');
  if (clean.length < 7) return null;
  const first = clean[0];
  if (!['3', '4', '5', '6'].includes(first)) return null;

  const day = clean.slice(1, 3);
  const month = clean.slice(3, 5);
  const yearShort = clean.slice(5, 7);
  const century = (first === '3' || first === '4') ? '19' : '20';
  const fullYear = `${century}${yearShort}`;

  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;

  return `${fullYear}-${month}-${day}`;
};

/**
 * Aholi bandligi monitoringi bo'yicha yosh chegarasini tekshirish (18 - 60 yosh)
 */
export const isValidYouthAge = (
  birthDate: string
): { valid: boolean; message?: string } => {
  if (!birthDate) return { valid: false, message: 'Tugʻilgan sana majburiy' };

  const birth = new Date(birthDate);
  const today = new Date();

  if (isNaN(birth.getTime())) {
    return { valid: false, message: 'Sana formati notoʻgʻri' };
  }

  if (birth > today) {
    return { valid: false, message: 'Tugʻilgan sana kelajakda boʻlishi mumkin emas' };
  }

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 18) {
    return {
      valid: false,
      message: `Fuqaroning yoshi ${age} da (voyaga yetmagan bola). Bandlik monitoringiga faqat 18 yoshga toʻlgan fuqarolar kiritiladi`,
    };
  }

  if (age > 60) {
    return {
      valid: false,
      message: `Fuqaroning yoshi ${age} da. Bandlik monitoringi 18 dan 60 yoshgacha boʻlgan fuqarolar uchun oʻtkaziladi`,
    };
  }

  return { valid: true };
};

/**
 * Fuqaroning yoshini hisoblash
 */
export const calculateAge = (birthDate: string): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
