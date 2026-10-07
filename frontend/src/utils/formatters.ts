/**
 * Mahalla nomini to'g'ri formatlash (MFY takrorlanishining oldini olish)
 */
export const formatMahallaName = (name?: string): string => {
  if (!name) return '-';
  const trimmed = name.trim();
  // Agar allaqachon MFY, mfy, yoki M.F.Y. bilan tugasa, qayta qo'shmaymiz
  if (/(MFY|mfy|M\.F\.Y\.)$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} MFY`;
};
