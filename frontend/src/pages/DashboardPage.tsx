import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { DashboardSummary, Mahalla, Survey } from '../types/monitoring.types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Briefcase,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Download,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  FilePlus,
  RefreshCw,
  Eye,
  ChevronDown,
  Check,
  Building2,
  CalendarDays,
  History,
  X,
  Search,
  Sparkles,
  Globe,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

import { useAreaFilter } from '../context/AreaFilterContext';
import { Pagination } from '../components/ui/Pagination';

export const DashboardPage: React.FC = () => {
  const { user, isSuperAdmin, isDistrictAdmin, isMahallaOperator } = useAuth();
  const navigate = useNavigate();

  const {
    selectedDistrictId,
    setSelectedDistrictId,
    selectedMahallaId,
    setSelectedMahallaId,
    currentDistrictName,
  } = useAreaFilter();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [mahallas, setMahallas] = useState<Mahalla[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [recentSurveysPage, setRecentSurveysPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Vaqt filteri holati (Time Filter state)
  const [timePreset, setTimePreset] = useState<string>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [customStart, setCustomStart] = useState<string>('2026-10-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-10-31');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState<boolean>(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  // Ustun bosilganda ochiladigan Eventlar tarixi modali
  const [selectedEventData, setSelectedEventData] = useState<{
    type: 'MAHALLA' | 'DAY';
    title: string;
    subtitle: string;
    total: number;
    official: number;
    selfEmployed: number;
    unofficial: number;
    migrant: number;
    unemployed: number;
    noWish: number;
    events: Survey[];
  } | null>(null);

  // Tashqariga bosilganda date filter dropdownni yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
    };
    if (isDateFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateFilterOpen]);

  // Mahalla filter popover holati (Tuman Boshlig'i va Admin uchun)
  const [isMahallaFilterOpen, setIsMahallaFilterOpen] = useState<boolean>(false);
  const [mahallaSearchQuery, setMahallaSearchQuery] = useState<string>('');
  const mahallaFilterRef = useRef<HTMLDivElement>(null);

  // Tashqariga bosilganda mahalla filter dropdownni yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mahallaFilterRef.current && !mahallaFilterRef.current.contains(event.target as Node)) {
        setIsMahallaFilterOpen(false);
      }
    };
    if (isMahallaFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMahallaFilterOpen]);

  // Vaqt oralig'i yozuvi
  const timeFilterLabel = useMemo(() => {
    if (timePreset === 'TODAY') return 'Bugun';
    if (timePreset === 'THIS_WEEK') return 'Oxirgi 7 kun';
    if (timePreset === 'THIS_MONTH') return 'Shu oy (Oktabr 2026)';
    if (timePreset === 'LAST_MONTH') return 'Oʻtgan oy (Sentabr)';
    if (timePreset === 'THIS_YEAR') return 'Shu yil (2026)';
    if (timePreset === 'ALL') return 'Barcha davr';
    if (startDate && endDate) return `${startDate} – ${endDate}`;
    return '01 Okt 2026 - 31 Okt 2026';
  }, [timePreset, startDate, endDate]);

  // Tab yoki filtrlash o'zgarganda jadval sahifasini 1-ga qaytarish
  useEffect(() => {
    setRecentSurveysPage(1);
  }, [activeTab, selectedMahallaId, timePreset, startDate, endDate]);

  // Mahalla qidiruv va ko'rsatish mantiqi
  const filteredMahallaOptions = useMemo(() => {
    if (!mahallaSearchQuery.trim()) return mahallas;
    const q = mahallaSearchQuery.toLowerCase();
    return mahallas.filter((m) => (m.name || '').toLowerCase().includes(q));
  }, [mahallas, mahallaSearchQuery]);

  const selectedMahallaObj = useMemo(() => {
    return mahallas.find((m) => m.id === selectedMahallaId);
  }, [mahallas, selectedMahallaId]);

  const selectedMahallaDisplayName = selectedMahallaObj
    ? `${(selectedMahallaObj.name || '').replace(/\s*MFY\s*/gi, '')} MFY`
    : 'Barcha mahallalar (Umumiy)';

  const setPeriod = (preset: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    let s = '';
    let e = '';

    if (preset === 'TODAY') {
      s = formatDate(now);
      e = formatDate(now);
    } else if (preset === 'THIS_WEEK') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      s = formatDate(weekStart);
      e = formatDate(now);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      s = formatDate(firstDay);
      e = formatDate(lastDay);
    } else if (preset === 'LAST_MONTH') {
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      s = formatDate(firstDay);
      e = formatDate(lastDay);
    } else if (preset === 'THIS_YEAR') {
      s = `${y}-01-01`;
      e = `${y}-12-31`;
    } else if (preset === 'ALL') {
      s = '';
      e = '';
    }

    setTimePreset(preset);
    setStartDate(s);
    setEndDate(e);
    setIsDateFilterOpen(false);
  };

  const applyCustomRange = () => {
    setTimePreset('CUSTOM');
    setStartDate(customStart);
    setEndDate(customEnd);
    setIsDateFilterOpen(false);
  };

  const fetchDashboardData = async (
    distId?: string,
    mId?: string,
    sDate?: string,
    eDate?: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await monitoringApi.getDashboardSummary({
        districtId: distId || undefined,
        mahallaId: mId || undefined,
        startDate: sDate || undefined,
        endDate: eDate || undefined,
      });
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Statistika ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    monitoringApi
      .getMahallasDropdown(selectedDistrictId || undefined)
      .then((res) => setMahallas(res as any))
      .catch(() => {});

    fetchDashboardData(selectedDistrictId, selectedMahallaId, startDate, endDate);
  }, [selectedDistrictId, selectedMahallaId, startDate, endDate]);

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    setSelectedMahallaId('');
  };

  const handleMahallaChange = (mId: string) => {
    setSelectedMahallaId(mId);
  };

  // Drill down: tegishli fuqarolar ro'yxatiga o'tish
  const handleDrillDown = (category?: string) => {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (selectedDistrictId) query.set('districtId', selectedDistrictId);
    if (selectedMahallaId) query.set('mahallaId', selectedMahallaId);
    navigate(`/citizens?${query.toString()}`);
  };

  const welcomeAreaText = useMemo(() => {
    if (user?.mahallaName) {
      return user.mahallaName.includes('MFY') ? user.mahallaName : `${user.mahallaName} MFY`;
    }
    const roleCode = user?.roleCode || user?.role;
    if (roleCode === 'DISTRICT_ADMIN') {
      return user?.districtName || 'Tuman';
    }
    if (roleCode === 'SUPER_ADMIN') {
      if (!selectedDistrictId) return 'Namangan viloyati (barcha tumanlar)';
      return currentDistrictName;
    }
    return currentDistrictName || 'Namangan viloyati';
  }, [user, selectedDistrictId, currentDistrictName]);

  const programAreaText = useMemo(() => {
    if (user?.mahallaName) {
      return user.mahallaName;
    }
    const roleCode = user?.roleCode || user?.role;
    if (roleCode === 'DISTRICT_ADMIN') {
      return user?.districtName || 'tuman';
    }
    if (roleCode === 'SUPER_ADMIN') {
      if (!selectedDistrictId) return 'Namangan viloyati tumanlari';
      return currentDistrictName;
    }
    return currentDistrictName || 'hududlar';
  }, [user, selectedDistrictId, currentDistrictName]);

  // Hisobot ma'lumotlarini Excel/CSV formatida yuklab olish (Export)
  const handleExportData = () => {
    try {
      const areaName = welcomeAreaText;
      let csv = `"O'ZBEKISTON RESPUBLIKASI YOSHLAR BANDLIGI MONITORINGI VA TAHLILI"\n`;
      csv += `"Hudud:","${areaName}"\n`;
      csv += `"Hisobot davri:","${timeFilterLabel}"\n`;
      csv += `"Eksport qilingan vaqt:","${new Date().toLocaleString('uz-UZ')}"\n\n`;

      csv += `"1. ASOSIY BANDLIK KO'RSATKICHLARI (KPI)"\n`;
      csv += `"Ko'rsatkich toifasi","Fuqarolar soni","Umumiy ulushdagi foizi"\n`;
      csv += `"Jami o'rganilgan fuqarolar","${kpi?.totalCitizens || 0}","100%"\n`;
      csv += `"Rasmiy band yoshlar","${kpi?.officiallyEmployed?.count || 0}","${kpi?.officiallyEmployed?.percentage || 0}%"\n`;
      csv += `"Norasmiy band yoshlar","${kpi?.unofficiallyEmployed?.count || 0}","${kpi?.unofficiallyEmployed?.percentage || 0}%"\n`;
      csv += `"Ishsiz yoshlar","${kpi?.unemployed?.count || 0}","${kpi?.unemployed?.percentage || 0}%"\n`;
      csv += `"Ishlash istagi yo'qlar","${kpi?.noWishToWork?.count || 0}","${kpi?.noWishToWork?.percentage || 0}%"\n`;
      csv += `"Boshqa holatlar","${kpi?.other?.count || 0}","${kpi?.other?.percentage || 0}%"\n\n`;

      csv += `"2. O'RGANILGAN FUQAROLAR XATLOV RO'YXATI"\n`;
      csv += `"№","Fuqaro F.I.Sh.","JSHSHIR","Tug'ilgan sana","Telefon raqami","Mahalla","O'rganish shakli","Bandlik toifasi","Batafsil ma'lumot (Ish joyi / Faoliyat / Sabab / Izoh)","So'rovnoma sanasi","Status"\n`;

      const list = summary?.recentSurveys || [];
      list.forEach((s, idx) => {
        const details =
          s.officialWorkplace ||
          s.unofficialActivityType ||
          s.noWishReason ||
          s.unemployedDirections?.join(', ') ||
          s.otherReasonNote ||
          '-';

        const categoryText =
          s.mainCategory === 'OFFICIALLY_EMPLOYED'
            ? 'Rasmiy band'
            : s.mainCategory === 'UNOFFICIALLY_EMPLOYED'
            ? 'Norasmiy band'
            : s.mainCategory === 'UNEMPLOYED'
            ? 'Ishsiz yosh'
            : s.mainCategory === 'NO_WISH_TO_WORK'
            ? 'Ishlash istagi yo\'q'
            : 'Boshqa';

        const methodText =
          s.surveyMethod === 'HOME_VISIT'
            ? 'Uyma-uy'
            : s.surveyMethod === 'PHONE'
            ? 'Telefon'
            : 'Qabulda';

        const cleanPinfl = `="${s.citizenPinfl}"`;

        csv += `"${idx + 1}","${s.citizenFullName}","${cleanPinfl}","${s.citizen?.birthDate || '-'}","${s.citizen?.phone || '-'}","${s.mahalla?.name || '-'}","${methodText}","${categoryText}","${details.replace(/"/g, '""')}","${s.surveyDate}","${s.status === 'APPROVED' ? 'Tasdiqlangan' : 'Tekshiruvda'}"\n`;
      });

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanArea = areaName.replace(/\s+/g, '_');
      link.setAttribute('download', `bandlik_hisobot_${cleanArea}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  // So'nggi so'rovnomalarni tab bo'yicha filtrlash
  const filteredSurveys = useMemo(() => {
    const list = summary?.recentSurveys || [];
    if (activeTab === 'ALL') return list;
    if (activeTab === 'PENDING') {
      return list.filter((s) => s.status === 'PENDING_REVIEW');
    }
    return list.filter((s) => s.mainCategory === activeTab);
  }, [summary?.recentSurveys, activeTab]);

  const kpi = summary?.kpi;

  // Bar chart uchun mahallalar ma'lumotlari (Yashil, Sariq, Qizil toifalar bilan)
  // So'rovnoma sanasini insonbop formatlash (soatsiz, faqat rasmiy kiritilgan sana)
  const formatSurveyDateLabel = (dateInput?: string | Date | null) => {
    if (!dateInput) return null;
    const str = String(dateInput).slice(0, 10);
    const parts = str.split('-');
    if (parts.length !== 3) return null;

    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const targetDate = new Date(y, m, d);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const monthNames = [
      'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
      'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ];
    const monthFullNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];

    const isToday = targetDate.getTime() === today.getTime();
    const isYesterday = targetDate.getTime() === yesterday.getTime();
    const dayStr = String(d).padStart(2, '0');
    const monthShort = monthNames[m] || '';
    const monthFull = monthFullNames[m] || '';

    let shortLabel = `${dayStr}-${monthShort}`;
    let fullLabel = `${dayStr}-${monthFull} ${y}`;

    if (isToday) {
      shortLabel = 'Bugun';
      fullLabel = `Bugun (${dayStr}-${monthShort})`;
    } else if (isYesterday) {
      shortLabel = 'Kecha';
      fullLabel = `Kecha (${dayStr}-${monthShort})`;
    }

    return {
      isToday,
      isYesterday,
      shortLabel,
      fullLabel,
    };
  };

  // Bar chart uchun 6 ta asosiy toifaning hududiy umumiy statistikasi
  const categoryBarData = useMemo(() => {
    return [
      {
        key: 'OFFICIALLY_EMPLOYED',
        name: 'Rasmiy band',
        shortName: 'Rasmiy',
        count: kpi?.officiallyEmployed?.count || 0,
        percentage: kpi?.officiallyEmployed?.percentage || 0,
        color: '#10B981',
      },
      {
        key: 'SELF_EMPLOYED',
        name: 'Oʻzini band',
        shortName: 'Oʻzini band',
        count: kpi?.selfEmployed?.count || 0,
        percentage: kpi?.selfEmployed?.percentage || 0,
        color: '#0284C7',
      },
      {
        key: 'UNOFFICIALLY_EMPLOYED',
        name: 'Norasmiy',
        shortName: 'Norasmiy',
        count: kpi?.unofficiallyEmployed?.count || 0,
        percentage: kpi?.unofficiallyEmployed?.percentage || 0,
        color: '#F59E0B',
      },
      {
        key: 'MIGRANT',
        name: 'Migrant',
        shortName: 'Migrant',
        count: kpi?.migrant?.count || 0,
        percentage: kpi?.migrant?.percentage || 0,
        color: '#8B5CF6',
      },
      {
        key: 'UNEMPLOYED',
        name: 'Ishsizlar',
        shortName: 'Ishsiz',
        count: kpi?.unemployed?.count || 0,
        percentage: kpi?.unemployed?.percentage || 0,
        color: '#EF4444',
      },
      {
        key: 'NO_WISH_TO_WORK',
        name: 'Istagi yoʻq',
        shortName: 'Istagi yoʻq',
        count: kpi?.noWishToWork?.count || 0,
        percentage: kpi?.noWishToWork?.percentage || 0,
        color: '#94A3B8',
      },
    ];
  }, [kpi]);

  // Haftalik mini trend ma'lumotlari: Du, Se, Cho, Pa, Ju, Sha, Ya
  const weeklyTrendData = useMemo(() => {
    const trendList = summary?.trendData || [];
    const uzDaysShort = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];
    const uzDaysFull = [
      'Dushanba',
      'Seshanba',
      'Chorshanba',
      'Payshanba',
      'Juma',
      'Shanba',
      'Yakshanba',
    ];

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    // Faqat joriy haftaning 7 kuni (Dushanbadan Yakshanbagacha)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const matched = trendList.find((t) => t.date === dateStr);
      const count = matched ? Number(matched.count) || 0 : 0;

      weekDays.push({
        dayLabel: uzDaysShort[i],
        fullDayName: uzDaysFull[i],
        dateStr,
        displayDate: `${dd}.${mm}`,
        count,
        official: matched ? Number((matched as any).official) || 0 : 0,
        selfEmployed: matched ? Number((matched as any).selfEmployed) || 0 : 0,
        unofficial: matched ? Number((matched as any).unofficial) || 0 : 0,
        migrant: matched ? Number((matched as any).migrant) || 0 : 0,
        unemployed: matched ? Number((matched as any).unemployed) || 0 : 0,
        noWish: matched ? Number((matched as any).noWish) || 0 : 0,
        isToday: d.toDateString() === now.toDateString(),
      });
    }

    return weekDays;
  }, [summary?.trendData]);

  // So'nggi xatlov eventining sanasi va tafsilotlari (soatsiz, faqat rasmiy sana)
  const latestSurveyEvent = useMemo(() => {
    const surveys = summary?.recentSurveys || [];
    if (surveys.length === 0) return null;
    const latest = surveys[0];
    const parsedDate = formatSurveyDateLabel(latest.surveyDate || latest.createdAt);
    if (!parsedDate) return null;

    return {
      dateText: parsedDate.fullLabel,
      mahallaName: latest.mahalla?.name ? (latest.mahalla.name.includes('MFY') ? latest.mahalla.name : `${latest.mahalla.name} MFY`) : (user?.districtName || currentDistrictName || 'Hudud'),
      citizenName: latest.citizenFullName,
      category: latest.mainCategory,
    };
  }, [summary?.recentSurveys]);

  const openEventModal = (payload: any) => {
    if (!payload) return;
    const searchName = (payload.name || '').toLowerCase();
    const matchingSurveys = (summary?.recentSurveys || []).filter((s) => {
      const mName = (s.mahalla?.name || '').toLowerCase();
      return mName.includes(searchName) || searchName.includes(mName);
    });

    setSelectedEventData({
      type: 'MAHALLA',
      title: payload.fullName || (payload.name?.includes('MFY') ? payload.name : `${payload.name} MFY`),
      subtitle: payload.eventDateFull
        ? `Xatlov sanasi: ${payload.eventDateFull}`
        : 'Ushbu hudud boʻyicha oʻrganishlar jurnali',
      total: payload.total || 0,
      official: payload.official || 0,
      selfEmployed: payload.selfEmployed || 0,
      unofficial: payload.unofficial || 0,
      migrant: payload.migrant || 0,
      unemployed: payload.unemployed || 0,
      noWish: payload.noWish || 0,
      events: matchingSurveys,
    });
  };

  const handleChartClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      openEventModal(state.activePayload[0].payload);
    }
  };

  const getStatusBadge = (category: string, status?: string) => {
    if (status === 'PENDING_REVIEW') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
          Tekshiruvda
        </span>
      );
    }

    switch (category) {
      case 'OFFICIALLY_EMPLOYED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Rasmiy band
          </span>
        );
      case 'SELF_EMPLOYED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5"></span>
            Oʻzini band qilgan
          </span>
        );
      case 'UNOFFICIALLY_EMPLOYED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Norasmiy band
          </span>
        );
      case 'MIGRANT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mr-1.5"></span>
            Migrant
          </span>
        );
      case 'UNEMPLOYED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            Ishsiz yosh
          </span>
        );
      case 'NO_WISH_TO_WORK':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
            Istagi yoʻq
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
            Boshqa
          </span>
        );
    }
  };

  // Sichqoncha borganda chiqadigan toifalar tooltipi
  const CustomCategoryChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl px-3.5 py-2.5 text-xs shadow-xl border border-slate-700/60 pointer-events-none min-w-[170px]">
        <div className="flex items-center space-x-2 font-bold border-b border-slate-700/70 pb-1.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-white text-xs font-black">{item.name}</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Soni:</span>
            <b className="text-white font-black">{Number(item.count || 0).toLocaleString()} nafar</b>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Ulushi:</span>
            <b className="font-extrabold" style={{ color: item.color }}>{item.percentage}%</b>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
          Roʻyxatni koʻrish uchun ustunga bosing 👆
        </div>
      </div>
    );
  };

  // Grafik ustuni ostida toifa nomi va ulushini chiqarish
  const CustomCategoryAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const item = categoryBarData[payload.index];
    if (!item) return null;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={12}
          textAnchor="middle"
          fill="#334155"
          fontSize={11.5}
          fontWeight={700}
        >
          {item.shortName || item.name}
        </text>
        <text
          x={0}
          y={0}
          dy={26}
          textAnchor="middle"
          fill={item.color}
          fontSize={10}
          fontWeight={800}
        >
          {item.percentage}%
        </text>
      </g>
    );
  };

  const CustomWeeklyTrendTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;

    return (
      <div className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 border-2 border-slate-200 shadow-lg text-xs min-w-[170px]">
        <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
          <span>{item.fullDayName}</span>
          <span className="text-[10px] font-semibold text-slate-400">{item.displayDate}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-500 font-medium">Xatlovlar soni:</span>
          <span className="font-bold text-[#163D5C]">{item.count} ta</span>
        </div>
        {item.count > 0 && (
          <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-slate-100">
            <span className="text-emerald-700">Rasmiy: <b>{item.official}</b></span>
            <span className="text-sky-700">Oʻzini band: <b>{item.selfEmployed}</b></span>
            <span className="text-amber-700">Norasmiy: <b>{item.unofficial}</b></span>
            <span className="text-violet-700">Migrant: <b>{item.migrant}</b></span>
            <span className="text-rose-700">Ishsiz: <b>{item.unemployed}</b></span>
            <span className="text-slate-600">Istagi yoʻq: <b>{item.noWish}</b></span>
          </div>
        )}
      </div>
    );
  };

  // Haftalik trend chizig'ida bugungi kunning nuqtasini YASHIL qilib ko'rsatish
  const renderWeeklyTrendDot = (dotProps: any) => {
    const { cx, cy, payload } = dotProps;
    if (cx == null || cy == null) return null;

    if (payload?.isToday) {
      return (
        <g key={`dot-today-${payload.dayLabel}`}>
          {/* Yashil tashqi nurlanish (halo halqa) */}
          <circle cx={cx} cy={cy} r={8} fill="#10B981" opacity={0.3} />
          {/* Asosiy yashil nuqta */}
          <circle
            cx={cx}
            cy={cy}
            r={4.5}
            fill="#10B981"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        </g>
      );
    }

    return (
      <circle
        key={`dot-${payload?.dayLabel}`}
        cx={cx}
        cy={cy}
        r={3}
        fill="#163D5C"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
    );
  };

  return (
    <DashboardLayout
      title="Boshqaruv Paneli"
      breadcrumbs={['Sahifalar', 'Boshqaruv paneli']}
      selectedDistrictId={selectedDistrictId}
      onDistrictChange={handleDistrictChange}
    >
      {/* 1. Sarlavha va Asosiy Harakatlar (Screenshot 3 "Xush kelibsiz" uslubi) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Xush kelibsiz, {user?.fullName?.split(' ')[0] || 'Foydalanuvchi'}.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {welcomeAreaText} boʻyicha yoshlar bandligi koʻrsatkichlarini kuzatib boring.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border-2 border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Maʻlumotlar ulangan</span>
          </div>

          {isMahallaOperator && (
            <button
              type="button"
              onClick={() => navigate('/new-survey')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FilePlus className="w-4 h-4 text-sky-200" />
              <span>Yangi soʻrovnoma</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDrillDown()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <span>Fuqarolar reyestri</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Dastur Status E'loni (Screenshot 3 dagi nafis xabarnoma uslubi) */}
      <div className="bg-[#163D5C]/5 border-2 border-[#163D5C]/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Yoshlar bandligi davlat monitoringi dasturi (2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {programAreaText}da uyma-uy soʻrovnomalar orqali haqiqiy bandlik holati shakllantirilmoqda.
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-[#163D5C] bg-white px-3.5 py-1.5 rounded-xl border-2 border-[#163D5C]/20 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Monitoring faol holatda</span>
        </div>
      </div>

      {/* 3. Filtr Tablari va Davr tanlagich (Screenshot 2-3 uslubida) */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Kategoriya Tablari (Sonlar ko'rsatilgan interaktiv tugmalar) */}
          {/* Kategoriya Tablari (Nomiga yarasha rangli interaktiv tugmalar) */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl border-2 border-slate-200 text-xs overflow-x-auto gap-1">
            {[
              {
                id: 'ALL',
                label: 'Barchasi',
                count: kpi?.totalCitizens || 0,
                dotColor: 'bg-[#163D5C]',
                textColor: 'text-slate-800',
                activeTextColor: 'text-[#163D5C]',
                activeBorder: 'border-[#163D5C]/30 ring-2 ring-[#163D5C]/10',
                hoverBg: 'hover:bg-slate-200/60',
                inactiveBadge: 'bg-slate-200 text-slate-700',
                activeBadge: 'bg-[#163D5C] text-white',
              },
              {
                id: 'OFFICIALLY_EMPLOYED',
                label: 'Rasmiy band',
                count: kpi?.officiallyEmployed.count || 0,
                dotColor: 'bg-emerald-500',
                textColor: 'text-emerald-700',
                activeTextColor: 'text-emerald-800',
                activeBorder: 'border-emerald-300 ring-2 ring-emerald-500/20',
                hoverBg: 'hover:bg-emerald-50',
                inactiveBadge: 'bg-emerald-100 text-emerald-800',
                activeBadge: 'bg-emerald-600 text-white',
              },
              {
                id: 'UNOFFICIALLY_EMPLOYED',
                label: 'Norasmiy band',
                count: kpi?.unofficiallyEmployed.count || 0,
                dotColor: 'bg-amber-500',
                textColor: 'text-amber-700',
                activeTextColor: 'text-amber-800',
                activeBorder: 'border-amber-300 ring-2 ring-amber-500/20',
                hoverBg: 'hover:bg-amber-50',
                inactiveBadge: 'bg-amber-100 text-amber-800',
                activeBadge: 'bg-amber-500 text-white',
              },
              {
                id: 'UNEMPLOYED',
                label: 'Ishsizlar',
                count: kpi?.unemployed.count || 0,
                dotColor: 'bg-rose-500',
                textColor: 'text-rose-700',
                activeTextColor: 'text-rose-800',
                activeBorder: 'border-rose-300 ring-2 ring-rose-500/20',
                hoverBg: 'hover:bg-rose-50',
                inactiveBadge: 'bg-rose-100 text-rose-800',
                activeBadge: 'bg-rose-600 text-white',
              },
              {
                id: 'PENDING',
                label: 'Tekshiruvda',
                count: summary?.pendingReviewsCount || 0,
                dotColor: 'bg-purple-500 animate-pulse',
                textColor: 'text-purple-700',
                activeTextColor: 'text-purple-800',
                activeBorder: 'border-purple-300 ring-2 ring-purple-500/20',
                hoverBg: 'hover:bg-purple-50',
                inactiveBadge: 'bg-purple-100 text-purple-800',
                activeBadge: 'bg-purple-600 text-white',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'ALL') {
                      setTimeout(() => {
                        document.getElementById('recent-surveys-table')?.scrollIntoView({ behavior: 'smooth' });
                      }, 50);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                    isActive
                      ? `bg-white ${tab.activeTextColor} shadow-xs border ${tab.activeBorder}`
                      : `${tab.textColor} ${tab.hoverBg}`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tab.dotColor} shrink-0`}></span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black transition-colors ${
                      isActive ? tab.activeBadge : tab.inactiveBadge
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Vaqt & Eksport */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Vaqt Filteri (Interaktiv Davr Tanlagich) */}
            <div className="relative" ref={dateFilterRef}>
              <button
                type="button"
                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                className={`flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl border-2 transition text-xs font-semibold shadow-2xs cursor-pointer ${
                  isDateFilterOpen ? 'border-[#163D5C] ring-2 ring-[#163D5C]/10 text-[#163D5C]' : 'border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#163D5C]" />
                <span>{timeFilterLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isDateFilterOpen ? 'rotate-180 text-[#163D5C]' : ''}`} />
              </button>

              {/* Floating Date Picker Popover */}
              {isDateFilterOpen && (
                <>
                  {/* Mobil xira fon (Backdrop) */}
                  <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden"
                    onClick={() => setIsDateFilterOpen(false)}
                  />
                  <div className="fixed inset-x-4 top-28 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 bg-white rounded-2xl p-4 shadow-2xl sm:shadow-xl border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">
                      Vaqt oraligʻini tanlang
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDateFilterOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tezkor tanlovlar (Presets) */}
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {[
                      { id: 'THIS_MONTH', label: 'Shu oy' },
                      { id: 'THIS_WEEK', label: 'Oxirgi 7 kun' },
                      { id: 'TODAY', label: 'Bugun' },
                      { id: 'LAST_MONTH', label: 'Oʻtgan oy' },
                      { id: 'THIS_YEAR', label: 'Shu yil (2026)' },
                      { id: 'ALL', label: 'Barcha davr' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPeriod(p.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer flex items-center justify-between ${
                          timePreset === p.id
                            ? 'bg-[#163D5C] text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{p.label}</span>
                        {timePreset === p.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>

                  {/* Ixtiyoriy sana oralig'i (Custom Range) */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Ixtiyoriy sana oraligʻi
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium mb-1">
                          Boshlanish:
                        </label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-[#163D5C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium mb-1">
                          Tugash:
                        </label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-[#163D5C]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={applyCustomRange}
                      className="w-full mt-2 py-2 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Qoʻllash</span>
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>

            {/* Eksport Tugmasi (Haqiqiy Excel/CSV hisobot yuklab oladi) */}
            <button
              type="button"
              onClick={handleExportData}
              title="Hisobotni Excel/CSV formatida yuklab olish"
              className="flex items-center space-x-1.5 bg-[#163D5C] hover:bg-[#11314a] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-200" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filtr faolligi haqida xabarnoma (Toggle bosilganda darhol ekranda ko'rinadi) */}
        {activeTab !== 'ALL' && (
          <div className="mt-3 p-3 rounded-2xl bg-[#163D5C]/5 border-2 border-[#163D5C]/20 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#163D5C] animate-pulse"></span>
              <span className="text-slate-800 font-semibold">
                Tanlangan toifa: <b>{
                  activeTab === 'OFFICIALLY_EMPLOYED'
                    ? 'Rasmiy band yoshlar'
                    : activeTab === 'SELF_EMPLOYED'
                    ? 'Oʻzini band qilganlar'
                    : activeTab === 'UNOFFICIALLY_EMPLOYED'
                    ? 'Norasmiy band yoshlar'
                    : activeTab === 'MIGRANT'
                    ? 'Migrantlar'
                    : activeTab === 'UNEMPLOYED'
                    ? 'Ishsiz yoshlar'
                    : 'Tekshiruvdagi anketalar'
                }</b> ({filteredSurveys.length} ta anketa)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('recent-surveys-table')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-2.5 py-1 rounded-lg bg-[#163D5C] text-white font-bold text-xs hover:bg-[#11314a] transition cursor-pointer"
              >
                Jadvalda koʻrish ↓
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold text-xs cursor-pointer"
              >
                Tozalash ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. 6 ta Asosiy KPI Kartochkalari (Qalin borderli, interaktiv tanlov bilan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Karta 1: Jami oʻrganilgan */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'ALL'
              ? 'border-[#163D5C] ring-4 ring-[#163D5C]/10 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jami oʻrganilgan
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#163D5C]/10 text-[#163D5C] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1">
              {(kpi?.totalCitizens || 0).toLocaleString()}
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/20 text-[11px]">
                Umumiy
              </span>
              <span className="text-slate-400 font-medium text-[11px]">xatlovdan oʻtganlar</span>
            </div>
          </div>
        </div>

        {/* Karta 2: Rasmiy band */}
        <div
          onClick={() => setActiveTab('OFFICIALLY_EMPLOYED')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'OFFICIALLY_EMPLOYED'
              ? 'border-emerald-500 ring-4 ring-emerald-500/15 bg-emerald-50/20 shadow-sm'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rasmiy band
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1 flex items-baseline space-x-1.5">
              <span>{(kpi?.officiallyEmployed?.count || 0).toLocaleString()}</span>
              <span className="text-xs font-extrabold text-emerald-600">
                {kpi?.officiallyEmployed?.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                Qonuniy
              </span>
              <span className="text-slate-400 font-medium text-[11px]">shartnoma</span>
            </div>
          </div>
        </div>

        {/* Karta 3: Oʻzini band qilgan */}
        <div
          onClick={() => setActiveTab('SELF_EMPLOYED')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'SELF_EMPLOYED'
              ? 'border-sky-500 ring-4 ring-sky-500/15 bg-sky-50/20 shadow-sm'
              : 'border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Oʻzini band qilgan
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1 flex items-baseline space-x-1.5">
              <span>{(kpi?.selfEmployed?.count || 0).toLocaleString()}</span>
              <span className="text-xs font-extrabold text-sky-600">
                {kpi?.selfEmployed?.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-600">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[11px]">
                Mustaqil
              </span>
              <span className="text-slate-400 font-medium text-[11px]">2.2 toifa</span>
            </div>
          </div>
        </div>

        {/* Karta 4: Norasmiy band */}
        <div
          onClick={() => setActiveTab('UNOFFICIALLY_EMPLOYED')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'UNOFFICIALLY_EMPLOYED'
              ? 'border-amber-500 ring-4 ring-amber-500/15 bg-amber-50/20 shadow-sm'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Norasmiy band
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1 flex items-baseline space-x-1.5">
              <span>{(kpi?.unofficiallyEmployed?.count || 0).toLocaleString()}</span>
              <span className="text-xs font-extrabold text-amber-600">
                {kpi?.unofficiallyEmployed?.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                Mavsumiy
              </span>
              <span className="text-slate-400 font-medium text-[11px]">legalizatsiya</span>
            </div>
          </div>
        </div>

        {/* Karta 5: Migrant */}
        <div
          onClick={() => setActiveTab('MIGRANT')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'MIGRANT'
              ? 'border-violet-500 ring-4 ring-violet-500/15 bg-violet-50/20 shadow-sm'
              : 'border-slate-200 hover:border-violet-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Migrant
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1 flex items-baseline space-x-1.5">
              <span>{(kpi?.migrant?.count || 0).toLocaleString()}</span>
              <span className="text-xs font-extrabold text-violet-600">
                {kpi?.migrant?.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-violet-600">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 text-[11px]">
                Chet elda
              </span>
              <span className="text-slate-400 font-medium text-[11px]">2.5 toifa</span>
            </div>
          </div>
        </div>

        {/* Karta 6: Ishsiz yoshlar */}
        <div
          onClick={() => setActiveTab('UNEMPLOYED')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'UNEMPLOYED'
              ? 'border-rose-500 ring-4 ring-rose-500/15 bg-rose-50/20 shadow-sm'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ishsiz yoshlar
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1 flex items-baseline space-x-1.5">
              <span>{(kpi?.unemployed?.count || 0).toLocaleString()}</span>
              <span className="text-xs font-extrabold text-rose-600">
                {kpi?.unemployed?.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-600">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                Chora talab
              </span>
              <span className="text-slate-400 font-medium text-[11px]">2.4 yoʻnalish</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Grafika Bloklari (Qalin borderli 2 ta zamonaviy container) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chap grafik (2 ustun): Mahallalar kesimida rangli taqsimot yoki Kunlik Eventlar */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Taqsimot va Statistika
              </span>
              <h4 className="text-base font-bold text-slate-900 tracking-tight">
                {selectedMahallaObj
                  ? `${(selectedMahallaObj.name || '').replace(/\s*MFY\s*/gi, '')} MFY yoshlar bandligi taqsimoti`
                  : selectedDistrictId && currentDistrictName
                  ? `${currentDistrictName} boʻyicha yoshlar bandligi taqsimoti`
                  : 'Umumiy (Viloyat) boʻyicha yoshlar bandligi taqsimoti'}
              </h4>
            </div>

            {/* O'ng tomon: Mahalla Filteri va So'nggi xatlov badge */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Maxsus Chiroyli Mahalla Dropdown (Tuman Boshlig'i va Admin uchun) */}
              {!isMahallaOperator && (
                <div className="relative" ref={mahallaFilterRef}>
                  <button
                    type="button"
                    onClick={() => setIsMahallaFilterOpen(!isMahallaFilterOpen)}
                    className={`flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-xl border-2 transition text-xs font-bold shadow-2xs cursor-pointer ${
                      isMahallaFilterOpen || selectedMahallaId
                        ? 'border-[#163D5C] ring-2 ring-[#163D5C]/10 text-[#163D5C]'
                        : 'border-slate-200'
                    }`}
                  >
                    <span className="text-slate-500 font-medium text-[11px]">Mahalla:</span>
                    <span className="font-bold text-slate-900">{selectedMahallaDisplayName}</span>
                    {selectedMahallaId ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMahallaChange('');
                        }}
                        className="ml-1 px-1.5 py-0.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700 text-[10px]"
                        title="Filtrni tozalash"
                      >
                        Tozalash ✕
                      </span>
                    ) : (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                          isMahallaFilterOpen ? 'rotate-180 text-[#163D5C]' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Chiroyli Floating Mahalla Popover (Emojilarsiz, rasmiy dizayn) */}
                  {isMahallaFilterOpen && (
                    <>
                      {/* Mobil xira fon (Backdrop) */}
                      <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden"
                        onClick={() => setIsMahallaFilterOpen(false)}
                      />

                      <div className="fixed inset-x-4 top-28 z-50 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-2 w-auto sm:w-80 bg-white rounded-2xl p-3.5 shadow-2xl sm:shadow-xl border-2 border-slate-200 animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Mahallani tanlang
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Alohida mahalla koʻrsatkichlarini koʻrish uchun
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsMahallaFilterOpen(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Qidiruv */}
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Mahalla nomini qidirish..."
                            value={mahallaSearchQuery}
                            onChange={(e) => setMahallaSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#163D5C]"
                          />
                          {mahallaSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setMahallaSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
                              title="Tozalash"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Mahalla variantlari */}
                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleMahallaChange('');
                              setIsMahallaFilterOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition text-left cursor-pointer flex items-center justify-between ${
                              !selectedMahallaId
                                ? 'bg-[#163D5C] text-white shadow-xs font-bold'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>Barcha mahallalar (Umumiy koʻrsatkich)</span>
                            {!selectedMahallaId && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>

                        {filteredMahallaOptions.map((m) => {
                          const isSelected = selectedMahallaId === m.id;
                          const mName = `${(m.name || '').replace(/\s*MFY\s*/gi, '')} MFY`;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                handleMahallaChange(m.id);
                                setIsMahallaFilterOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition text-left cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-[#163D5C] text-white shadow-xs font-bold'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{mName}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}

                        {filteredMahallaOptions.length === 0 && (
                          <div className="py-4 text-center text-xs text-slate-400">
                            Bunday mahalla topilmadi
                          </div>
                        )}
                      </div>
                    </div>
                    </>
                  )}
                </div>
              )}

              {/* So'nggi xatlov sanasi nishoni - bir qatorda chiroyli va ixcham */}
              {latestSurveyEvent && (
                <div
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                  title="Eng soʻnggi xatlov sanasi"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Calendar className="w-3.5 h-3.5 text-[#163D5C]" />
                  <span>Soʻnggi xatlov:</span>
                  <b className="text-slate-900 font-bold">{latestSurveyEvent.dateText}</b>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#163D5C] font-semibold">{latestSurveyEvent.mahallaName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rangli ko'rsatkichlar (Legend) & Click hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center flex-wrap gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-700 font-semibold">Rasmiy</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span className="text-slate-700 font-semibold">Oʻzini band</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-700 font-semibold">Norasmiy</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                <span className="text-slate-700 font-semibold">Migrant</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-700 font-semibold">Ishsiz</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="text-slate-700 font-semibold">Istagi yoʻq</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-400">
              <span>Toifani tanlash uchun ustunga bosing 👆</span>
            </div>
          </div>

          <div className="w-full pb-1">
            <div className="h-72 w-full">
              {kpi && (kpi.totalCitizens > 0 || categoryBarData.some((c) => c.count > 0)) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryBarData}
                    margin={{ top: 25, right: 12, left: -15, bottom: 25 }}
                    barCategoryGap="16%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomCategoryAxisTick />}
                      interval={0}
                      height={42}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomCategoryChartTooltip />}
                      cursor={{ fill: '#F8FAFC' }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[8, 8, 0, 0]}
                      barSize={38}
                      cursor="pointer"
                      onClick={(entry: any) => {
                        if (entry && entry.key) {
                          setActiveTab(entry.key);
                          document.getElementById('recent-surveys-table')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      {categoryBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(val: number) => (val > 0 ? val.toLocaleString() : '0')}
                        style={{ fill: '#1E293B', fontSize: 11.5, fontWeight: 800 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  Hozircha tanlangan hudud boʻyicha xatlov maʻlumotlari mavjud emas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* O'ng grafik (1 ustun): Toifalar nisbati va Dinamika (Screenshot 3 dagi rangli barlar) */}
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Toifalar nisbati
                </span>
                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                  Bandlik toifalari ulushi
                </h4>
              </div>
              <span className="text-xs font-bold text-[#163D5C] bg-[#163D5C]/10 border border-[#163D5C]/20 px-2.5 py-1 rounded-xl">
                Umumiy ulush
              </span>
            </div>

            {/* Smart School 3-rasmdagi gorizontal rangli progress barlar */}
            <div className="space-y-3.5 my-3">
              {/* 1. Yashil: Rasmiy band */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Rasmiy band</span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {kpi?.officiallyEmployed?.percentage || 0}% ({kpi?.officiallyEmployed?.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.officiallyEmployed?.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 2. Moviy: Oʻzini band qilgan */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span>Oʻzini band qilgan</span>
                  </div>
                  <span className="font-bold text-sky-600">
                    {kpi?.selfEmployed?.percentage || 0}% ({kpi?.selfEmployed?.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.selfEmployed?.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 3. Sariq: Norasmiy band */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Norasmiy band</span>
                  </div>
                  <span className="font-bold text-amber-600">
                    {kpi?.unofficiallyEmployed?.percentage || 0}% ({kpi?.unofficiallyEmployed?.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.unofficiallyEmployed?.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 4. Binafsharang: Migrant */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                    <span>Migrant</span>
                  </div>
                  <span className="font-bold text-violet-600">
                    {kpi?.migrant?.percentage || 0}% ({kpi?.migrant?.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.migrant?.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 5. Qizil: Ishsiz yoshlar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Ishsiz yoshlar (ogohlik)</span>
                  </div>
                  <span className="font-bold text-rose-600">
                    {kpi?.unemployed?.percentage || 0}% ({kpi?.unemployed?.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.unemployed?.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 6. Kulrang: Istagi yo'qlar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span>Ishlash istagi yoʻq</span>
                  </div>
                  <span className="font-bold text-slate-500">
                    {kpi?.noWishToWork?.percentage || 0}% ({kpi?.noWishToWork?.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.noWishToWork?.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Pastida mini trend chizig'i (Kunlik so'rovnoma dinamikasi: Du, Se, Cho, Pa, Ju, Sha, Ya) */}
          <div className="pt-3 border-t-2 border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="font-bold text-slate-800 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#163D5C] mr-1" />
                Kunlik xatlov surʻati (Haftalik):
              </span>
              <span className="font-bold text-[#163D5C] bg-[#163D5C]/10 px-2 py-0.5 rounded-lg text-[10px]">
                Du — Ya
              </span>
            </div>
            {weeklyTrendData.length > 0 ? (
              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <XAxis
                      dataKey="dayLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={({ x, y, payload }) => {
                        const isToday = weeklyTrendData.find((d) => d.dayLabel === payload.value)?.isToday;
                        return (
                          <text
                            x={x}
                            y={Number(y) + 12}
                            textAnchor="middle"
                            fill={isToday ? '#10B981' : '#64748B'}
                            fontSize={isToday ? 12 : 11}
                            fontWeight={isToday ? 900 : 700}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <Tooltip content={<CustomWeeklyTrendTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#163D5C"
                      strokeWidth={2.5}
                      dot={renderWeeklyTrendDot}
                      activeDot={{ r: 6, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-xs text-slate-400 font-medium bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                Tanlangan davrda xatlov oʻtkazilmagan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Pastki Jadval: So'nggi so'rovnomalar (Smart School "Qurilmalar boshqaruvi" uslubi) */}
      <div id="recent-surveys-table" className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xs overflow-hidden scroll-mt-6">
        {/* Sarlavha va Action tugmalari */}
        <div className="p-5 border-b-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 tracking-tight">
              Soʻnggi xatlov yozuvlari
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Operatorlar tomonidan kiritilgan anketalar jurnali (KPI koʻrsatkichlarida fuqarolarning oxirgi amaldagi holati aks etadi)
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => fetchDashboardData(selectedDistrictId, selectedMahallaId)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/surveys')}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Barchasini koʻrish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Jadval qismi */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-5">Fuqaro F.I.Sh.</th>
                <th className="py-3.5 px-4">Sana</th>
                <th className="py-3.5 px-4">Mahalla</th>
                <th className="py-3.5 px-4">Oʻrganish shakli</th>
                <th className="py-3.5 px-4">Bandlik Holati</th>
                <th className="py-3.5 px-5 text-right">Batafsil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSurveys.length > 0 ? (
                (() => {
                  const displaySurveys = filteredSurveys.slice(
                    (recentSurveysPage - 1) * 10,
                    recentSurveysPage * 10
                  );
                  const seenCitizenMap = new Map<string, number>();
                  filteredSurveys.forEach((s: Survey) => {
                    const key = s.citizenPinfl || s.citizenId || s.citizenFullName;
                    seenCitizenMap.set(key, (seenCitizenMap.get(key) || 0) + 1);
                  });

                  return displaySurveys.map((survey: Survey, idx: number) => {
                    const key = survey.citizenPinfl || survey.citizenId || survey.citizenFullName;
                    const isMulti = (seenCitizenMap.get(key) || 0) > 1;
                    const isLatest = filteredSurveys.findIndex(
                      (s) => (s.citizenPinfl || s.citizenId || s.citizenFullName) === key
                    ) === ((recentSurveysPage - 1) * 10 + idx);

                    return (
                      <tr key={survey.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                          {(recentSurveysPage - 1) * 10 + idx + 1}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-xl bg-[#163D5C]/10 text-[#163D5C] flex items-center justify-center font-bold text-xs shrink-0">
                              {survey.citizenFullName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <span className="truncate max-w-[200px] text-slate-900 font-bold">
                                  {survey.citizenFullName}
                                </span>
                                {isMulti && (
                                  isLatest ? (
                                    <span
                                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                                      title="Fuqaroning eng soʻnggi tasdiqlangan amaldagi holati"
                                    >
                                      Amaldagi
                                    </span>
                                  ) : (
                                    <span
                                      className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 border border-slate-200 shrink-0"
                                      title="Fuqaroning avvalgi xatlov yozuvi (arxiv tarixi)"
                                    >
                                      Oldingi xatlov
                                    </span>
                                  )
                                )}
                              </div>
                              {survey.citizenPinfl && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  JSHSHIR: {survey.citizenPinfl}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {new Date(survey.surveyDate).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {survey.mahalla?.name || 'MFY'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {survey.surveyMethod === 'HOME_VISIT'
                            ? 'Uyma-uy'
                            : survey.surveyMethod === 'PHONE'
                            ? 'Telefon'
                            : 'Qabulda'}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(survey.mainCategory, survey.status)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => navigate(`/surveys`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#163D5C] hover:bg-slate-100 transition cursor-pointer"
                            title="Koʻrish"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-xs">
                    Hozircha tanlangan toifada anketalar mavjud emas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sahifalash (Pagination) */}
        {filteredSurveys.length > 0 && (
          <Pagination
            currentPage={recentSurveysPage}
            totalItems={filteredSurveys.length}
            pageSize={10}
            onPageChange={(p) => setRecentSurveysPage(p)}
          />
        )}
      </div>

      {/* 7. Xatlov Eventlari Tarixi Modali (Ustun yoki sana bosilganda ochiladi) */}
      {selectedEventData && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedEventData(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-2 border-slate-200 max-h-[90vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/20 flex items-center justify-center shrink-0">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {selectedEventData.type === 'MAHALLA' ? 'Hududiy Event' : 'Kunlik Event'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-emerald-600 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                        Xatlov jurnali
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                      {selectedEventData.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedEventData.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventData(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tezkor Ko'rsatkichlar (KPI Pills) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 my-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jami</span>
                  <span className="text-base font-black text-slate-900">{selectedEventData.total}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Rasmiy</span>
                  <span className="text-base font-black text-emerald-700">{selectedEventData.official}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-center">
                  <span className="text-[10px] font-bold text-sky-700 uppercase block">Oʻzini band</span>
                  <span className="text-base font-black text-sky-700">{selectedEventData.selfEmployed || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Norasmiy</span>
                  <span className="text-base font-black text-amber-700">{selectedEventData.unofficial}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-center">
                  <span className="text-[10px] font-bold text-violet-700 uppercase block">Migrant</span>
                  <span className="text-base font-black text-violet-700">{selectedEventData.migrant || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block">Ishsiz</span>
                  <span className="text-base font-black text-rose-700">{selectedEventData.unemployed}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Istagi yoʻq</span>
                  <span className="text-base font-black text-slate-700">{selectedEventData.noWish}</span>
                </div>
              </div>
            </div>

            {/* Event Timeline / Ro'yxat */}
            <div className="flex-1 overflow-y-auto max-h-[45vh] pr-1 space-y-2.5 my-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Anketalar va Xatlov Sanalari ({selectedEventData.events.length} ta soʻnggi yozuv)
              </span>
              {selectedEventData.events.length > 0 ? (
                selectedEventData.events.map((ev) => {
                  const dateStr = new Date(ev.surveyDate).toLocaleDateString('uz-UZ');
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-2xl bg-white border-2 border-slate-100 hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#163D5C]/10 text-[#163D5C] flex items-center justify-center font-bold text-xs shrink-0">
                          <Calendar className="w-4 h-4 text-[#163D5C]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {ev.citizenFullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ev.citizenPinfl ? `(${ev.citizenPinfl})` : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-bold text-[#163D5C]">{dateStr}</span>
                            <span>•</span>
                            <span>{ev.mahalla?.name || 'MFY'}</span>
                            <span>•</span>
                            <span>{ev.surveyMethod === 'HOME_VISIT' ? 'Uyma-uy' : ev.surveyMethod === 'PHONE' ? 'Telefon' : 'Qabulda'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {getStatusBadge(ev.mainCategory, ev.status)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Soʻnggi oʻrganishlar jurnali qisqa roʻyxatda emas</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Ushbu toʻplam boʻyicha barcha yozuvlarni Fuqarolar reyestri sahifasida batafsil tahlil qilishingiz mumkin.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
              <button
                type="button"
                onClick={() => setSelectedEventData(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedEventData(null);
                  handleDrillDown();
                }}
                className="px-4 py-2 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <span>Fuqarolar reyestrida ochish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
