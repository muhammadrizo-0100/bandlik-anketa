import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { Survey, Citizen } from '../types/monitoring.types';
import { useToast } from '../context/ToastContext';
import { formatMahallaName } from '../utils/formatters';
import { formatUzPhone } from '../utils/validators';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { realtimeService } from '../services/realtime.service';
import { useAreaFilter } from '../context/AreaFilterContext';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Phone,
  Building2,
  Loader2,
  ArrowRight,
  Search,
} from 'lucide-react';

const getCategoryLabel = (category?: string) => {
  switch (category) {
    case 'OFFICIALLY_EMPLOYED':
      return '2.1. Rasmiy band';
    case 'SELF_EMPLOYED':
      return '2.2. Oʻzini band qilgan';
    case 'UNOFFICIALLY_EMPLOYED':
      return '2.3. Norasmiy band';
    case 'UNEMPLOYED':
      return '2.4. Ishsiz yosh';
    case 'MIGRANT':
      return '2.5. Migrant';
    case 'NO_WISH_TO_WORK':
      return '2.6. Ishlash istagi yoʻq';
    case 'OTHER':
      return '2.7. Boshqa';
    default:
      return category || '—';
  }
};

const getNoWishReasonLabel = (reason?: string) => {
  switch (reason) {
    case 'HOUSEWIFE':
      return 'Uy bekasi';
    case 'CHILD_CARE':
      return 'Bola parvarishida';
    case 'STUDENT':
      return 'Talaba / Oʻquvchi';
    case 'HEALTH_REASONS':
      return 'Salomatligi sababli';
    case 'RETIRED':
      return 'Pensiyada';
    case 'WEALTHY':
      return 'Oʻziga toʻq (ehtiyoji yoʻq)';
    case 'APPLICANT':
      return 'Abituriyent / Oʻqishga tayyorlanmoqda';
    case 'OTHER':
      return 'Boshqa sabab';
    default:
      return reason || '';
  }
};

const getDistrictName = (dist: any): string => {
  if (!dist) return '';
  if (typeof dist === 'string') return dist;
  return dist.name || '';
};

const getMahallaName = (mah: any): string => {
  if (!mah) return '';
  if (typeof mah === 'string') return mah;
  return mah.name || '';
};

const formatDetailSummary = (survey: Survey) => {
  if (survey.mainCategory === 'OFFICIALLY_EMPLOYED') {
    return survey.officialWorkplace ? `Ish joyi: ${survey.officialWorkplace}` : 'Rasmiy ish joyiga ega';
  }
  if (survey.mainCategory === 'SELF_EMPLOYED') {
    const reg = survey.selfEmployedRegistered ? ' (Roʻyxatdan oʻtgan)' : '';
    return survey.selfEmployedActivity ? `Faoliyat: ${survey.selfEmployedActivity}${reg}` : 'Oʻzini band qilgan';
  }
  if (survey.mainCategory === 'UNOFFICIALLY_EMPLOYED') {
    return survey.unofficialActivityType ? `Faoliyat turi: ${survey.unofficialActivityType}` : 'Norasmiy bandlik';
  }
  if (survey.mainCategory === 'MIGRANT') {
    const dur = survey.migrantDuration ? `, Muddat: ${survey.migrantDuration}` : '';
    return survey.migrantCountry ? `Davlat: ${survey.migrantCountry}${dur}` : 'Migrant';
  }
  if (survey.mainCategory === 'NO_WISH_TO_WORK') {
    const reasonText = getNoWishReasonLabel(survey.noWishReason);
    return reasonText ? `Sababi: ${reasonText}` : 'Ishlash istagi mavjud emas';
  }
  if (survey.mainCategory === 'UNEMPLOYED') {
    const dirs = (survey.unemployedDirections || []).join(', ');
    return dirs ? `Talab: ${dirs}` : 'Ish qidirmoqda';
  }
  if (survey.mainCategory === 'OTHER') {
    return survey.otherReasonNote || 'Boshqa holat';
  }
  return '—';
};

export const ReviewQueuePage: React.FC = () => {
  const toast = useToast();
  const { selectedDistrictId, selectedMahallaId } = useAreaFilter();
  const [queue, setQueue] = useState<Survey[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Review Item Modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [itemData, setItemData] = useState<{
    pendingSurvey: Survey;
    existingCitizen: Citizen;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [reviewerNote, setReviewerNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchQueue = async (query?: string, pageNum?: number) => {
    try {
      setLoading(true);
      const res = await monitoringApi.getReviewQueue({
        limit: 10,
        page: pageNum || page,
        search: (query !== undefined ? query : search).trim() || undefined,
        districtId: selectedDistrictId || undefined,
        mahallaId: selectedMahallaId || undefined,
      });
      setQueue(res.items);
      setTotal(res.total);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [selectedDistrictId, selectedMahallaId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchQueue(search, page);
    }, 250);

    return () => clearTimeout(handler);
  }, [search, page, selectedDistrictId, selectedMahallaId]);

  // Real-time yangi ariza kelganda jadvalni avtomatik yangilash
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type === 'NEW_SURVEY') {
        fetchQueue(search, page);
      }
    });
    return () => unsubscribe();
  }, [search, page]);

  const handleOpenReview = async (id: string) => {
    setSelectedId(id);
    setItemData(null);
    setReviewerNote('');
    setModalLoading(true);
    try {
      const data = await monitoringApi.getReviewQueueItem(id);
      setItemData(data);
    } catch {
      toast.error('Soʻrovnoma maʼlumotlarini yuklashda xatolik yuz berdi');
      setSelectedId(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleResolve = async (action: 'APPROVE_UPDATE' | 'REJECT') => {
    if (!selectedId) return;

    try {
      setSubmitting(true);
      await monitoringApi.resolveReviewItem(selectedId, {
        action,
        reviewerNote: reviewerNote.trim() || undefined,
      });

      if (action === 'APPROVE_UPDATE') {
        toast.success('Soʻrovnoma tasdiqlandi va rasmiy roʻyxatga olindi');
      } else {
        toast.error('Soʻrovnoma rad etildi');
      }

      setItemData(null);
      setSelectedId(null);
      fetchQueue();
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Tekshiruv Navbati (Data Review Queue)"
      breadcrumbs={['Sahifalar', 'Tekshiruv navbati', 'Ziddiyatli anketalar']}
      searchValue={search}
      onSearch={setSearch}
      searchPlaceholder="Anketalardan qidirish (F.I.Sh., JSHSHIR, telefon)..."
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Ziddiyatli va Onlayn Yuborilgan Anketalar
                </h3>
                <p className="text-xs text-slate-400">
                  Tekshiruv va qaror qabul qilishni kutayotgan holatlar: {total} ta
                </p>
              </div>
            </div>

            {/* Promoy (jonli) qidiruv inputi */}
            <div className="w-full sm:w-80 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Qidirish (F.I.Sh., JSHSHIR, telefon)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
                  title="Tozalash"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : queue.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 font-medium flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Barcha holatlar koʻrib chiqilgan</span>
              <span className="text-xs text-slate-400 mt-1">Hozirda tekshiruv kutayotgan anketalar mavjud emas.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-5">Fuqaro F.I.Sh.</th>
                    <th className="py-3.5 px-4">JSHSHIR</th>
                    <th className="py-3.5 px-4">Mahalla</th>
                    <th className="py-3.5 px-4">Kiritilgan sana</th>
                    <th className="py-3.5 px-4">Tekshiruv sababi</th>
                    <th className="py-3.5 px-4">Yuboruvchi</th>
                    <th className="py-3.5 px-5 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {item.citizenFullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 tracking-wider">
                        {item.citizenPinfl}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {formatMahallaName(item.mahalla?.name)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 text-amber-800 max-w-xs font-medium">
                        {item.conflictReason}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {(item as any).dataSource === 'CITIZEN_PUBLIC' || (item.surveyMethod as any) === 'ONLINE'
                          ? 'Onlayn portal'
                          : item.operator?.fullName || 'Yetakchi'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(item.id)}
                          className="px-3.5 py-1.5 bg-[#163D5C] hover:bg-[#11314a] text-white rounded-xl font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Koʻrish & Hal qilish</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sahifalash (Pagination) */}
          {!loading && queue.length > 0 && (
            <Pagination
              currentPage={page}
              totalItems={total}
              pageSize={10}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      </div>

      {/* Review & Decision Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-150">
            {/* Modal Sarlavhasi (2-rasm uslubida toza) */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Soʻrovnomani tekshirish va rasmiy roʻyxatga olish
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Fuqaro yuborgan maʼlumotlarni tekshirib, bandlik monitoringi reestriga tasdiqlash
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalLoading || !itemData ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#163D5C]" />
                <span>Maʼlumotlar yuklanmoqda...</span>
              </div>
            ) : (() => {
              const survey = itemData.pendingSurvey;
              const citizen = itemData.existingCitizen;
              const hasCategoryDiff =
                citizen &&
                citizen.currentCategory &&
                citizen.currentCategory !== survey.mainCategory;

              return (
                <div className="space-y-4">
                  {/* Agar toifada real farq bo'lsa (Oldingi toifa vs Yangi toifa) */}
                  {hasCategoryDiff && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
                          Bazadagi oldingi toifa
                        </span>
                        <span className="font-semibold text-amber-900">
                          {getCategoryLabel(citizen.currentCategory)}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-600 shrink-0 mx-2" />
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
                          Yangi soʻrovnoma toifasi
                        </span>
                        <span className="font-bold text-amber-900">
                          {getCategoryLabel(survey.mainCategory)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tekshiruv / Ziddiyat sababi */}
                  {survey.conflictReason && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">Tekshiruv sababi: </span>
                        <span>{survey.conflictReason}</span>
                      </div>
                    </div>
                  )}

                  {/* Fuqaro va So'rovnoma ma'lumotlari (Yagona toza va to'liq karta) */}
                  <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-4">
                    {/* 1-qator: F.I.Sh. va JSHSHIR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3.5 border-b border-slate-200/70">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          Fuqaro F.I.Sh.
                        </span>
                        <span className="text-base font-bold text-slate-900 block">
                          {survey.citizenFullName}
                        </span>
                        {citizen?.birthDate && (
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Tugʻilgan sana: {new Date(citizen.birthDate).toLocaleDateString('uz-UZ')}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          JSHSHIR (14 ta raqam)
                        </span>
                        <span className="inline-block px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-sm sm:text-base font-bold text-slate-900 tracking-wider shadow-2xs">
                          {survey.citizenPinfl}
                        </span>
                      </div>
                    </div>

                    {/* 2-qator: Telefon raqamlari (Nomerlar) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3.5 border-b border-slate-200/70">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          Telefon raqami
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {citizen?.phone ? formatUzPhone(citizen.phone) : 'Kiritilmagan'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          Qoʻshimcha / Ota-onasi telefoni
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {citizen?.parentPhone ? formatUzPhone(citizen.parentPhone) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* 3-qator: Hudud va Manzil */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3.5 border-b border-slate-200/70">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          Biriktirilgan hudud
                        </span>
                        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatMahallaName(getMahallaName(survey.mahalla) || getMahallaName(citizen?.mahalla))}</span>
                          {(getDistrictName(survey.district) || getDistrictName(citizen?.district)) && (
                            <span className="text-slate-400 text-[11px]">
                              ({getDistrictName(survey.district) || getDistrictName(citizen?.district)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          Yashash manzili
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {citizen?.address || '—'}
                        </span>
                      </div>
                    </div>

                    {/* 4-qator: Bandlik toifasi va Batafsil maʼlumot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          Bandlik toifasi
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-[#163D5C] text-white shadow-2xs">
                          {getCategoryLabel(survey.mainCategory)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                          Batafsil holat / Izoh
                        </span>
                        <span className="text-xs font-bold text-slate-800 block">
                          {formatDetailSummary(survey)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reviewer Izohi (Ixtiyoriy) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tekshiruv xulosasi yoki izoh (ixtiyoriy)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Qoʻshimcha izoh yoki xulosa yozishingiz mumkin..."
                      value={reviewerNote}
                      onChange={(e) => setReviewerNote(e.target.value)}
                      className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 bg-white"
                    />
                  </div>

                  {/* Qaror tugmalari */}
                  <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleResolve('REJECT')}
                      className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Rad etish</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleResolve('APPROVE_UPDATE')}
                      className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Tasdiqlash & Roʻyxatga olish</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
