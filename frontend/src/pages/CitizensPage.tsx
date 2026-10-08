import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { Citizen, Mahalla, EmploymentCategory } from '../types/monitoring.types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatMahallaName } from '../utils/formatters';
import { isValidYouthAge, calculateAge, formatUzPhone } from '../utils/validators';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { useAreaFilter } from '../context/AreaFilterContext';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  Eye,
  X,
  History,
  Briefcase,
  GraduationCap,
  Phone,
  FilePlus,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Building2,
  Copy,
  FileText,
} from 'lucide-react';
export const CitizensPage: React.FC = () => {
  const { user, isSuperAdmin, isDistrictAdmin, isMahallaOperator, isDataReviewer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const canEditOrDelete = isSuperAdmin || isDistrictAdmin || isMahallaOperator;

  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [mahallas, setMahallas] = useState<Mahalla[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Yosh chegarasi: 18 - 60 yosh
  const { maxBirthDate, minBirthDate } = React.useMemo(() => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate());
    return {
      maxBirthDate: maxDate.toISOString().split('T')[0],
      minBirthDate: minDate.toISOString().split('T')[0],
    };
  }, []);

  const {
    selectedDistrictId,
    setSelectedDistrictId,
    selectedMahallaId,
    setSelectedMahallaId,
  } = useAreaFilter();

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || '',
  );

  const currentDistrictId = isDistrictAdmin ? user?.districtId || '' : selectedDistrictId;
  const currentMahallaId = isMahallaOperator ? user?.mahallaId || '' : selectedMahallaId;

  // URL query params orqali kelganda filtrlarni o'rnatish
  useEffect(() => {
    const qDist = searchParams.get('districtId');
    const qMah = searchParams.get('mahallaId');
    if (qDist && isSuperAdmin) setSelectedDistrictId(qDist);
    if (qMah && !isMahallaOperator) setSelectedMahallaId(qMah);
  }, []);

  // Modal State (Batafsil ma'lumot va bandlik tarixi)
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [copiedPinfl, setCopiedPinfl] = useState<boolean>(false);

  // Edit Modal State
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    pinfl: '',
    birthDate: '',
    phone: '',
    parentPhone: '',
    address: '',
    education: '',
    specialty: '',
    mahallaId: '',
    currentCategory: 'OFFICIALLY_EMPLOYED' as EmploymentCategory,
    currentStatusDetail: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingCitizen, setDeletingCitizen] = useState<Citizen | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const res = await monitoringApi.getCitizens({
        search: search || undefined,
        districtId: currentDistrictId || undefined,
        mahallaId: currentMahallaId || undefined,
        category: (selectedCategory as EmploymentCategory) || undefined,
        page,
        limit: pageSize,
      });
      setCitizens(res.items);
      setTotal(res.total);
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    monitoringApi
      .getMahallasDropdown(currentDistrictId || undefined)
      .then((res) => setMahallas(res as any))
      .catch(() => {});
  }, [currentDistrictId]);

  useEffect(() => {
    if (isSuperAdmin) {
      monitoringApi
        .getDistrictsDropdown()
        .then((res) => setDistricts(res))
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    setPage(1);
  }, [currentDistrictId, currentMahallaId]);

  // Avtomatik to'g'ridan-to'g'ri (debounced live search) qidirish
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCitizens();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, pageSize, search, currentDistrictId, currentMahallaId, selectedCategory]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleOpenDetails = async (id: string) => {
    setModalLoading(true);
    setSelectedCitizen(null);
    try {
      const data = await monitoringApi.getCitizenById(id);
      setSelectedCitizen(data);
    } catch {
      // error
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEdit = (citizen: Citizen) => {
    setEditingCitizen(citizen);
    setEditError(null);
    setEditForm({
      fullName: citizen.fullName || '',
      pinfl: citizen.pinfl || '',
      birthDate: citizen.birthDate
        ? new Date(citizen.birthDate).toISOString().split('T')[0]
        : '',
      phone: citizen.phone || '',
      parentPhone: citizen.parentPhone || '',
      address: citizen.address || '',
      education: citizen.education || '',
      specialty: citizen.specialty || '',
      mahallaId: citizen.mahallaId || citizen.mahalla?.id || '',
      currentCategory:
        (citizen.currentCategory as EmploymentCategory) || 'OFFICIALLY_EMPLOYED',
      currentStatusDetail: citizen.currentStatusDetail || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCitizen) return;

    if (!editForm.fullName.trim() || editForm.fullName.trim().split(' ').length < 2) {
      setEditError('F.I.Sh. kamida 2 ta soʻzdan iborat boʻlishi kerak');
      return;
    }
    if (!editForm.pinfl || editForm.pinfl.length !== 14 || !/^\d{14}$/.test(editForm.pinfl)) {
      setEditError('JSHSHIR aniq 14 ta raqamdan iborat boʻlishi shart');
      return;
    }
    if (!editForm.birthDate) {
      setEditError('Tugʻilgan sana kiritilishi shart');
      return;
    }
    const ageValidation = isValidYouthAge(editForm.birthDate);
    if (!ageValidation.valid) {
      setEditError(ageValidation.message || 'Yosh chegarasi notoʻgʻri');
      return;
    }
    if (!editForm.address.trim()) {
      setEditError('Yashash manzili kiritilishi shart');
      return;
    }
    if (!editForm.education.trim()) {
      setEditError('Taʼlim muassasasi kiritilishi shart');
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError(null);

      const updated = await monitoringApi.updateCitizen(editingCitizen.id, {
        fullName: editForm.fullName.trim(),
        pinfl: editForm.pinfl.trim(),
        birthDate: editForm.birthDate,
        phone: editForm.phone.trim() || undefined,
        parentPhone: editForm.parentPhone.trim() || undefined,
        address: editForm.address.trim(),
        education: editForm.education.trim(),
        specialty: editForm.specialty.trim() || undefined,
        mahallaId: editForm.mahallaId || undefined,
        currentCategory: editForm.currentCategory,
        currentStatusDetail: editForm.currentStatusDetail.trim() || undefined,
      });

      toast.success('Fuqaro maʼlumotlari muvaffaqiyatli tahrirlandi!');
      setEditingCitizen(null);
      if (selectedCitizen?.id === editingCitizen.id) {
        setSelectedCitizen(updated);
      }
      fetchCitizens();
    } catch (err: any) {
      const msg = err.message || 'Tahrirlashda xatolik yuz berdi';
      setEditError(msg);
      toast.error(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCitizen) return;
    try {
      setDeleteSubmitting(true);
      await monitoringApi.deleteCitizen(deletingCitizen.id);
      toast.success('Fuqaro tizimdan muvaffaqiyatli oʻchirildi!');
      if (selectedCitizen?.id === deletingCitizen.id) {
        setSelectedCitizen(null);
      }
      setDeletingCitizen(null);
      fetchCitizens();
    } catch (err: any) {
      toast.error(err.message || 'Oʻchirishda xatolik yuz berdi');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const getCategoryBadge = (cat?: EmploymentCategory) => {
    switch (cat) {
      case 'OFFICIALLY_EMPLOYED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700">Rasmiy band</span>;
      case 'SELF_EMPLOYED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700">Oʻzini band qilgan</span>;
      case 'UNOFFICIALLY_EMPLOYED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700">Norasmiy band</span>;
      case 'MIGRANT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-violet-50 text-violet-700">Migrant</span>;
      case 'UNEMPLOYED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700">Ishsiz</span>;
      case 'NO_WISH_TO_WORK':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">Ishlash istagi yoʻq</span>;
      case 'OTHER':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Boshqa</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-400">Noma'lum</span>;
    }
  };

  const getSurveyMethodText = (method?: string) => {
    switch (method) {
      case 'HOME_VISIT':
        return 'Uyma-uy yurib oʻrganish';
      case 'PHONE':
        return 'Telefon orqali soʻrov';
      case 'IN_PERSON':
        return 'Muassasaga kelganda (Qabulda)';
      default:
        return method || 'Aniqlanmagan';
    }
  };

  const getNoWishReasonText = (reason?: string) => {
    switch (reason) {
      case 'CHILD_CARE':
        return 'Bola parvarishida (tarbiyasida)';
      case 'HOUSEWIFE':
        return 'Uy bekasi';
      case 'WEALTHY_FAMILY':
        return 'Oʻziga toʻq oila farzandi';
      case 'APPLICANT':
        return 'Abituriyent (Oʻqishga tayyorlanmoqda)';
      default:
        return reason || 'Sabab koʻrsatilmagan';
    }
  };

  return (
    <DashboardLayout
      title="Fuqarolar Reyestri"
      breadcrumbs={['Sahifalar', 'Fuqarolar', 'Yoshlar roʻyxati']}
      searchValue={search}
      onSearch={handleSearchChange}
      searchPlaceholder="F.I.Sh., JSHSHIR yoki telefon boʻyicha qidirish..."
    >
      <div className="space-y-6">
        {/* Search and Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="F.I.Sh., JSHSHIR yoki telefon boʻyicha qidirish..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
                title="Tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSuperAdmin && (
            <div className="w-full md:w-52">
              <CustomSelect
                placeholder="Barcha tumanlar"
                searchable={true}
                value={selectedDistrictId}
                onChange={(val) => {
                  setSelectedDistrictId(val);
                  setSelectedMahallaId('');
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Barcha tumanlar' },
                  ...districts.map((d) => ({
                    value: d.id,
                    label: d.name,
                  })),
                ]}
              />
            </div>
          )}

          {!isMahallaOperator && (
            <div className="w-full md:w-56">
              <CustomSelect
                placeholder="Barcha mahallalar"
                searchable={true}
                value={selectedMahallaId}
                onChange={(val) => {
                  setSelectedMahallaId(val);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Barcha mahallalar' },
                  ...mahallas.map((m) => ({
                    value: m.id,
                    label: formatMahallaName(m.name),
                  })),
                ]}
              />
            </div>
          )}

          <div className="w-full md:w-56">
            <CustomSelect
              placeholder="Barcha bandlik toifalari"
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Barcha toifalar' },
                { value: 'OFFICIALLY_EMPLOYED', label: '2.1. Rasmiy band' },
                { value: 'SELF_EMPLOYED', label: '2.2. Oʻzini band qilgan' },
                { value: 'UNOFFICIALLY_EMPLOYED', label: '2.3. Norasmiy band' },
                { value: 'UNEMPLOYED', label: '2.4. Ishsiz yoshlar' },
                { value: 'MIGRANT', label: '2.5. Migrant' },
                { value: 'NO_WISH_TO_WORK', label: '2.6. Ishlash istagi yoʻq' },
                { value: 'OTHER', label: '2.7. Boshqa' },
              ]}
            />
          </div>
        </div>

        {/* Citizens Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Roʻyxatga Olingan Fuqarolar Bazasi
                </h3>
                <p className="text-xs text-slate-400">
                  Jami topilgan fuqarolar: {total} nafar
                </p>
              </div>
            </div>

            {!isDataReviewer && (
              <button
                type="button"
                onClick={() => navigate('/new-survey')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                <span>+ Yangi soʻrovnoma kiritish</span>
              </button>
            )}
          </div>

          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : citizens.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center">
              <Users className="w-10 h-10 text-slate-300 mb-2" />
              <span>Fuqarolar topilmadi</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-5">F.I.Sh.</th>
                    <th className="py-3.5 px-4">JSHSHIR</th>
                    <th className="py-3.5 px-4">Mahalla</th>
                    <th className="py-3.5 px-4">Tug'ilgan sana</th>
                    <th className="py-3.5 px-4">Bandlik toifasi</th>
                    <th className="py-3.5 px-4">Holat tavsifi</th>
                    <th className="py-3.5 px-5 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citizens.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-indigo-50/30 transition group">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {c.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {c.pinfl}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {formatMahallaName(c.mahalla?.name)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(c.birthDate).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4">
                        {getCategoryBadge(c.currentCategory)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={c.currentStatusDetail}>
                        {c.currentStatusDetail || '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(c.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#163D5C] hover:bg-slate-100 transition cursor-pointer"
                            title="Batafsil koʻrish"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEditOrDelete && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(c)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                                title="Tahrirlash"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingCitizen(c)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Oʻchirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sahifalash (Pagination) */}
          {!loading && citizens.length > 0 && (
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

      {/* Citizen Details & History Modal */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {selectedCitizen.fullName}
                  </h3>
                  <div>{getCategoryBadge(selectedCitizen.currentCategory)}</div>
                </div>

                {/* JSHSHIR — Rasmiy Davlat Formati (Ko'zga yaqqol tashlanadigan qilib) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#163D5C] text-white rounded-xl shadow-xs">
                    <span className="text-[11px] font-bold text-slate-300">JSHSHIR:</span>
                    <span className="font-mono text-xs font-black tracking-widest select-all">
                      {selectedCitizen.pinfl}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCitizen.pinfl);
                        setCopiedPinfl(true);
                        toast.success('JSHSHIR nusxalandi');
                        setTimeout(() => setCopiedPinfl(false), 2000);
                      }}
                      className="ml-1 text-slate-300 hover:text-white p-0.5 rounded transition cursor-pointer"
                      title="JSHSHIRni nusxalash"
                    >
                      {copiedPinfl ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Tug'ilgan sana va Yoshi */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{calculateAge(selectedCitizen.birthDate) || '-'} yosh</span>
                    <span className="text-slate-300">•</span>
                    <span>{new Date(selectedCitizen.birthDate).toLocaleDateString('uz-UZ')}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* I. Shaxsiy va Yashash ma'lumotlari */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-[#163D5C]" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Shaxsiy va Hududiy Maʻlumotlar
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Mahalla va Tuman:</span>
                  <span className="font-bold text-slate-800">
                    {formatMahallaName(selectedCitizen.mahalla?.name)}
                    {(selectedCitizen as any).district?.name ? `, ${(selectedCitizen as any).district.name}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Yashash manzili:</span>
                  <span className="font-bold text-slate-800">
                    {selectedCitizen.address || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Telefon raqami:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedCitizen.phone ? formatUzPhone(selectedCitizen.phone) : 'Kiritilmagan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Ota-onasi telefoni:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedCitizen.parentPhone ? formatUzPhone(selectedCitizen.parentPhone) : 'Kiritilmagan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Taʻlim muassasasi:</span>
                  <span className="font-bold text-slate-800">
                    {selectedCitizen.education || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Mutaxassisligi:</span>
                  <span className="font-bold text-slate-800">
                    {selectedCitizen.specialty || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* II. Bandlik holati va Anketadagi batafsil izohlar / qaydlar */}
            {(() => {
              const latestSurvey = selectedCitizen.surveys && selectedCitizen.surveys.length > 0
                ? selectedCitizen.surveys[0]
                : null;

              const workplace = latestSurvey?.officialWorkplace;
              const selfActivity = latestSurvey?.selfEmployedActivity;
              const isRegistered = latestSurvey?.selfEmployedRegistered;
              const unoffActivity = latestSurvey?.unofficialActivityType;
              const migrantPlace = latestSurvey?.migrantCountry;
              const migrantTime = latestSurvey?.migrantDuration;
              const noWish = latestSurvey?.noWishReason;
              const unempDirections = latestSurvey?.unemployedDirections;

              // Anketadagi izoh / xulosa (eng muhim maydon)
              const noteText =
                latestSurvey?.unemployedAdditionalNote ||
                latestSurvey?.otherReasonNote ||
                latestSurvey?.reviewerNote ||
                selectedCitizen.currentStatusDetail;

              return (
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-[#163D5C]" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Bandlik Holati va Anketadagi Izohlar
                    </h4>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 block mb-1 font-medium">Joriy toifa:</span>
                        <div>{getCategoryBadge(selectedCitizen.currentCategory)}</div>
                      </div>

                      {/* Toifaga xos batafsil ko'rsatkichlar */}
                      {selectedCitizen.currentCategory === 'OFFICIALLY_EMPLOYED' && (
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Ish joyi va lavozimi:</span>
                          <span className="font-bold text-slate-900">
                            {workplace || selectedCitizen.currentStatusDetail || '-'}
                          </span>
                        </div>
                      )}

                      {selectedCitizen.currentCategory === 'SELF_EMPLOYED' && (
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Faoliyat yoʻnalishi:</span>
                          <span className="font-bold text-slate-900 block">
                            {selfActivity || selectedCitizen.currentStatusDetail || '-'}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Soliq roʻyxati:{' '}
                            <b className={isRegistered ? 'text-emerald-700' : 'text-amber-700'}>
                              {isRegistered ? 'Ha, roʻyxatdan oʻtgan' : 'Roʻyxatdan oʻtmagan'}
                            </b>
                          </span>
                        </div>
                      )}

                      {selectedCitizen.currentCategory === 'UNOFFICIALLY_EMPLOYED' && (
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Norasmiy faoliyat turi:</span>
                          <span className="font-bold text-slate-900">
                            {unoffActivity || selectedCitizen.currentStatusDetail || '-'}
                          </span>
                        </div>
                      )}

                      {selectedCitizen.currentCategory === 'MIGRANT' && (
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Ketgan davlati va muddati:</span>
                          <span className="font-bold text-slate-900">
                            {migrantPlace || '-'} {migrantTime ? `(${migrantTime})` : ''}
                          </span>
                        </div>
                      )}

                      {selectedCitizen.currentCategory === 'NO_WISH_TO_WORK' && (
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Ishlamaslik sababi:</span>
                          <span className="font-bold text-slate-900">
                            {getNoWishReasonText(noWish) || selectedCitizen.currentStatusDetail || '-'}
                          </span>
                        </div>
                      )}

                      {selectedCitizen.currentCategory === 'UNEMPLOYED' && unempDirections && unempDirections.length > 0 && (
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Talab qilingan yoʻnalishlar:</span>
                          <span className="font-bold text-slate-900">
                            {unempDirections.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Izoh qismi — Alohida toza, rasmiy oq karta */}
                    {noteText && (
                      <div className="pt-2.5 border-t border-slate-200">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                          Anketada koʻrsatilgan izoh / Xulosa:
                        </span>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-semibold leading-relaxed shadow-2xs">
                          {noteText}
                        </div>
                      </div>
                    )}

                    {/* Xatlov o'tkazilganligi tafsilotlari */}
                    {latestSurvey && (
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
                        <span>
                          Oʻrganish shakli: <b className="text-slate-700">{getSurveyMethodText(latestSurvey.surveyMethod)}</b>
                        </span>
                        <span>
                          Sana: <b className="text-slate-700">{new Date(latestSurvey.surveyDate || latestSurvey.createdAt).toLocaleDateString('uz-UZ')}</b>
                        </span>
                        {latestSurvey.operator && (
                          <span>
                            Masʻul xodim: <b className="text-slate-700">{latestSurvey.operator.fullName}</b>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* III. Bandlik Tarixi (Employment History Log) */}
            <div>
              <div className="flex items-center space-x-2 mb-2.5">
                <History className="w-4 h-4 text-[#163D5C]" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bandlik Tarixi (Oʻzgarishlar jurnali)
                </h4>
              </div>

              {selectedCitizen.employmentHistory && selectedCitizen.employmentHistory.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedCitizen.employmentHistory.map((h, i) => (
                    <div
                      key={h.id || i}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium">Toifa:</span>
                          <div>{getCategoryBadge(h.newCategory)}</div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(h.createdAt).toLocaleString('uz-UZ')}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs">
                        <span className="font-semibold text-slate-500">Sabab / Xulosa:</span>{' '}
                        <span className="font-medium text-slate-800">{h.changeReason}</span>
                      </p>
                      {h.changedBy && (
                        <p className="text-slate-400 text-[10px]">
                          Masʻul xodim: {h.changedBy.fullName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
                  Tarix yozuvlari mavjud emas
                </p>
              )}
            </div>

            {/* Modal Actions */}
            {canEditOrDelete && (
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(selectedCitizen);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tahrirlash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeletingCitizen(selectedCitizen);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Oʻchirish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fuqaroni tahrirlash modali */}
      {editingCitizen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Fuqaro maʼlumotlarini tahrirlash
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID: {editingCitizen.id.slice(0, 8)}... | JSHSHIR: {editingCitizen.pinfl}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCitizen(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* F.I.Sh. */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  F.I.Sh. (Familiya, Ism, Sharif) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Masalan: Abdullayev Temur Shokirovich"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-medium"
                />
              </div>

              {/* JSHSHIR va Tug'ilgan sana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    JSHSHIR (14 ta raqam) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={editForm.pinfl}
                    onChange={(e) => setEditForm({ ...editForm, pinfl: e.target.value.replace(/\D/g, '').slice(0, 14) })}
                    placeholder="30102030400012"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Tugʻilgan sana <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={maxBirthDate}
                    min={minBirthDate}
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Telefonlar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Fuqaro telefon raqami
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+998 (90) 123-45-67"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Ota-onasining telefoni
                  </label>
                  <input
                    type="text"
                    value={editForm.parentPhone}
                    onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                    placeholder="+998 (91) 987-65-43"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Yashash manzili va Ta'lim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Yashash manzili <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Koʻcha, uy raqami"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Taʼlim muassasasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.education}
                    onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                    placeholder="Masalan: 14-maktab, TATU"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Mutaxassislik va Mahalla */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Mutaxassisligi
                  </label>
                  <input
                    type="text"
                    value={editForm.specialty}
                    onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                    placeholder="Masalan: Dasturchi, Quruvchi, Tikuvchi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  {isMahallaOperator ? (
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                        Mahalla nomi
                      </label>
                      <div className="h-10 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-between font-medium">
                        <span>{editingCitizen.mahalla?.name ? formatMahallaName(editingCitizen.mahalla.name) : 'Biriktirilgan mahalla'}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">Biriktirilgan</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <CustomSelect
                        label="Mahalla nomi"
                        required
                        searchable={true}
                        placeholder="Mahallani tanlang..."
                        value={editForm.mahallaId}
                        onChange={(val) => setEditForm({ ...editForm, mahallaId: val })}
                        icon={<Building2 className="w-4 h-4 text-[#163D5C]" />}
                        options={mahallas.map((m) => ({
                          value: m.id,
                          label: formatMahallaName(m.name),
                        }))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Joriy bandlik toifasi */}
              <div>
                <CustomSelect
                  label="Joriy bandlik toifasi"
                  required
                  value={editForm.currentCategory}
                  onChange={(val) => setEditForm({ ...editForm, currentCategory: val as EmploymentCategory })}
                  options={[
                    { value: 'OFFICIALLY_EMPLOYED', label: '2.1. Rasmiy band' },
                    { value: 'SELF_EMPLOYED', label: '2.2. Oʻzini band qilgan' },
                    { value: 'UNOFFICIALLY_EMPLOYED', label: '2.3. Norasmiy band' },
                    { value: 'UNEMPLOYED', label: '2.4. Ishsiz yoshlar' },
                    { value: 'MIGRANT', label: '2.5. Migrant' },
                    { value: 'NO_WISH_TO_WORK', label: '2.6. Ishlash istagi yoʻq' },
                    { value: 'OTHER', label: '2.7. Boshqa' },
                  ]}
                />
              </div>

              {/* Holat tavsifi */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Holat tafsiloti / Ish joyi / Izoh
                </label>
                <textarea
                  rows={2}
                  value={editForm.currentStatusDetail}
                  onChange={(e) => setEditForm({ ...editForm, currentStatusDetail: e.target.value })}
                  placeholder="Ish joyi, faoliyat turi yoki sabab izohi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50 text-slate-800 font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCitizen(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white font-semibold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Oʻzgarishlarni saqlash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fuqaroni o'chirishni tasdiqlash modali */}
      {deletingCitizen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Fuqaroni oʻchirishni tasdiqlaysizmi?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ushbu fuqaroni tizimdan butunlay oʻchirib tashlamoqchimisiz?
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fuqaro:</span>
                <span className="font-bold text-slate-800">{deletingCitizen.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">JSHSHIR:</span>
                <span className="font-mono font-semibold text-slate-700">{deletingCitizen.pinfl}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mahalla:</span>
                <span className="font-semibold text-slate-700">
                  {formatMahallaName(deletingCitizen.mahalla?.name)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                Diqqat: Fuqaro oʻchirilganda, unga tegishli barcha soʻrovnomalar va bandlik tarixi ham tizimdan butunlay oʻchiriladi. Ushbu amalni ortga qaytarib boʻlmaydi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCitizen(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteConfirm}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Oʻchirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ha, oʻchirilsin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
