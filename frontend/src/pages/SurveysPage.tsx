import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { Survey, SurveyStatus } from '../types/monitoring.types';
import { formatMahallaName } from '../utils/formatters';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  Filter,
  UserCheck,
  X,
} from 'lucide-react';

import { useAreaFilter } from '../context/AreaFilterContext';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';

export const SurveysPage: React.FC = () => {
  const { selectedDistrictId, selectedMahallaId } = useAreaFilter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await monitoringApi.getSurveys({
        search: search.trim() || undefined,
        districtId: selectedDistrictId || undefined,
        mahallaId: selectedMahallaId || undefined,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as any),
        page,
        limit: pageSize,
      });
      setSurveys(res.items);
      setTotal(res.total);
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSurveys();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedDistrictId, selectedMahallaId, statusFilter, page, pageSize]);

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const getStatusBadge = (status: SurveyStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tasdiqlangan
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Tekshiruvda
          </span>
        );
      case 'RESOLVED':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60"
            title="Ziddiyat tekshiruvchi tomonidan koʻrib chiqilib tasdiqlangan"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tekshiruvdan oʻtgan
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rad etilgan
          </span>
        );
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
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
        return category;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'HOME_VISIT':
        return 'Uyma-uy';
      case 'PHONE':
        return 'Telefon';
      case 'IN_PERSON':
        return 'Qabulda';
      default:
        return method;
    }
  };

  return (
    <DashboardLayout
      title="Soʻrovnomalar Reyestri"
      breadcrumbs={['Sahifalar', 'Soʻrovnomalar', 'Barcha anketalar']}
      searchValue={search}
      onSearch={handleSearch}
      searchPlaceholder="Fuqaro F.I.Sh., JSHSHIR yoki telefon boʻyicha qidirish..."
    >
      <div className="space-y-6">
        {/* Yuqori Filter va Qidiruv Paneli */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Fuqaro F.I.Sh., JSHSHIR yoki telefon boʻyicha qidirish..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
                title="Tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => handleStatusChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Barchasi ({total})
            </button>
            <button
              onClick={() => handleStatusChange('APPROVED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'APPROVED'
                  ? 'bg-white text-emerald-600 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Tasdiqlangan
            </button>
            <button
              onClick={() => handleStatusChange('PENDING_REVIEW')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'PENDING_REVIEW'
                  ? 'bg-white text-amber-600 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Tekshiruvda
            </button>
          </div>
        </div>

        {/* Anketalar Jadvali */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Oʻtkazilgan Soʻrovnomalar Jurnali
                </h3>
                <p className="text-xs text-slate-400">
                  Reyestrda jami {total} ta yozuv mavjud
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : surveys.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center">
              <FileText className="w-10 h-10 text-slate-300 mb-2" />
              <span>Mos keluvchi soʻrovnomalar topilmadi</span>
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
                    <th className="py-3.5 px-4">Sana</th>
                    <th className="py-3.5 px-4">Shakl</th>
                    <th className="py-3.5 px-4">Bandlik toifasi</th>
                    <th className="py-3.5 px-4">Holati</th>
                    <th className="py-3.5 px-5">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {surveys.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition">
                          {s.citizenFullName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                        {s.citizenPinfl}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {formatMahallaName(s.mahalla?.name)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(s.surveyDate).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {getMethodLabel(s.surveyMethod)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {getCategoryLabel(s.mainCategory)}
                        </div>
                        {s.officialWorkplace && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {s.officialWorkplace}
                          </div>
                        )}
                        {s.unofficialActivityType && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {s.unofficialActivityType}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {s.operator?.fullName || 'Yetakchi'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sahifalash (Pagination) */}
          {!loading && surveys.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-t border-slate-100 px-4 py-2 gap-3">
              <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
                <span className="text-[11px] font-semibold text-slate-400 px-1.5">Qator:</span>
                {[10, 20, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      pageSize === size
                        ? 'bg-[#163D5C] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                className="border-t-0 p-0"
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

