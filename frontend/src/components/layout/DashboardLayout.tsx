import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useAreaFilter } from '../../context/AreaFilterContext';
import { Search, Bell, ChevronRight, ChevronLeft, ShieldCheck, X, Clock, CheckCircle2, Menu } from 'lucide-react';
import { formatMahallaName } from '../../utils/formatters';
import { monitoringApi } from '../../api/monitoring.api';
import { useSidebar } from '../../context/SidebarContext';
import { realtimeService, RealtimeSurveyEvent } from '../../services/realtime.service';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
  selectedDistrictId?: string;
  onDistrictChange?: (districtId: string) => void;
  searchValue?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs = ['Sahifalar', 'Dashboard'],
  selectedDistrictId,
  onDistrictChange,
  searchValue,
  onSearch,
  searchPlaceholder = 'Istalgan narsani qidiring (F.I.Sh., JSHSHIR, telefon)...',
}) => {
  const { user } = useAuth();
  const areaFilter = useAreaFilter();
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileOpen, closeMobileDrawer } = useSidebar();
  const navigate = useNavigate();
  const [internalSearch, setInternalSearch] = useState(searchValue || '');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [latestRealtimeEvent, setLatestRealtimeEvent] = useState<RealtimeSurveyEvent['data'] | null>(null);
  const [isWiggling, setIsWiggling] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const effectiveDistrictId = selectedDistrictId !== undefined ? selectedDistrictId : areaFilter.selectedDistrictId;

  const navAreaBadgeText = useMemo(() => {
    if (user?.mahallaName) {
      return formatMahallaName(user.mahallaName);
    }
    const roleCode = user?.roleCode || user?.role;
    if (roleCode === 'DISTRICT_ADMIN') {
      return user?.districtName || 'Tuman';
    }
    if (roleCode === 'SUPER_ADMIN') {
      if (!effectiveDistrictId) return 'Barcha tumanlar';
      const found = areaFilter.districts.find((d) => d.id === effectiveDistrictId);
      return found ? found.name : 'Barcha tumanlar';
    }
    return user?.districtName || areaFilter.currentDistrictName;
  }, [user, effectiveDistrictId, areaFilter.districts, areaFilter.currentDistrictName]);

  // Web Audio API orqali yumshoq bildirishnoma qo'ng'irog'i
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback siyosati
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const res = await monitoringApi.getReviewQueueCount();
        if (isMounted && res && typeof res.count === 'number') {
          setPendingCount(res.count);
        }
      } catch (err) {
        // Sukut saqlanadi
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 20000);

    // Real-time oqimga obuna bo'lish (SSE + BroadcastChannel + localStorage)
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type === 'NEW_SURVEY' && event.data) {
        setPendingCount((prev) => prev + 1);
        setLatestRealtimeEvent(event.data);
        setIsWiggling(true);
        playNotificationSound();

        setTimeout(() => setIsWiggling(false), 2000);

        // Server bilan aniq sinxronizatsiya
        fetchCount();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Real-time toast bildirishnomani 8 soniyada avtomatik yopish
  useEffect(() => {
    if (!latestRealtimeEvent) return;
    const timer = setTimeout(() => {
      setLatestRealtimeEvent(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [latestRealtimeEvent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  useEffect(() => {
    if (searchValue !== undefined) {
      setInternalSearch(searchValue);
    }
  }, [searchValue]);

  const handleInputChange = (val: string) => {
    setInternalSearch(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!onSearch && internalSearch.trim()) {
        navigate(`/citizens?search=${encodeURIComponent(internalSearch.trim())}`);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-800 antialiased select-none">
      {/* 1. Desktop Sidebar (Faqat lg: va undan katta ekranlarda) */}
      <aside className={`hidden lg:block relative ${isCollapsed ? 'w-20' : 'w-64'} h-screen flex-shrink-0 z-30 transition-[width] duration-300 ease-in-out`}>
        <Sidebar
          selectedDistrictId={selectedDistrictId}
          onDistrictChange={onDistrictChange}
          pendingCount={pendingCount}
        />

        {/* Toggle Collapse/Expand Button (< va >): Desktopda sidebarni markazida */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={isCollapsed ? "Sidebarni kattalashtirish (>)" : "Sidebarni kichiklashtirish (<)"}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-50 w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-600 hover:text-[#163D5C] hover:border-[#163D5C] hover:bg-slate-50 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </aside>

      {/* 2. Mobil Qalqib Chiquvchi Drawer (Off-Canvas: Telefon va Planshetlar uchun) */}
      {isMobileOpen && (
        <div
          onClick={closeMobileDrawer}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          selectedDistrictId={selectedDistrictId}
          onDistrictChange={onDistrictChange}
          isMobileDrawer={true}
          pendingCount={pendingCount}
        />
      </div>

      {/* Mustaqil scroll bo'luvchi asosiy qism */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto overflow-x-hidden select-text">
        {/* Top Header */}
        <header className="h-16 min-h-[64px] flex-shrink-0 bg-white border-b-2 border-slate-200/80 px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs gap-3">
          {/* Chap: Gamburger (Mobile) + Qidiruv inputi */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 flex-1 min-w-0">
            {/* Mobil Gamburger tugmasi (☰) */}
            <button
              type="button"
              onClick={toggleMobileOpen}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-700 hover:text-[#163D5C] flex items-center justify-center transition cursor-pointer flex-shrink-0"
              title="Menyuni ochish"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Qidiruv inputi */}
            <div className="relative flex-1 max-w-[220px] sm:max-w-xs md:max-w-sm lg:max-w-md">
              <input
                type="text"
                value={internalSearch}
                placeholder={searchPlaceholder}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-xs pl-3.5 pr-9 py-2 sm:pl-4 sm:pr-10 sm:py-2.5 rounded-xl border-2 border-slate-200 focus:border-[#163D5C] focus:outline-none transition font-medium"
              />
              {internalSearch ? (
                <button
                  type="button"
                  onClick={() => handleInputChange('')}
                  className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Search className="w-4 h-4 text-[#163D5C] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
          </div>

          {/* O'ng: Hudud nishoni, Bildirishnomalar va Profil */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            {/* Hudud nishoni (Navbar tepasida) */}
            <div className="hidden md:flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-semibold text-slate-700 flex-shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span className="truncate max-w-[160px]">
                {navAreaBadgeText}
              </span>
            </div>

            {/* Bildirishnomalar qo'ng'irog'i */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`w-10 h-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-2 border-slate-200 transition relative cursor-pointer flex items-center justify-center flex-shrink-0 ${
                  isWiggling ? 'animate-bounce ring-4 ring-rose-400/20 text-[#163D5C]' : ''
                }`}
                title="Bildirishnomalar"
              >
                <Bell className={`w-4 h-4 ${isWiggling ? 'text-rose-600' : ''}`} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </button>

              {/* Bildirishnomalar oynasi (Dropdown) */}
              {isNotifOpen && (
                <>
                  {/* Mobil xira fon */}
                  <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden"
                    onClick={() => setIsNotifOpen(false)}
                  />
                  <div className="fixed inset-x-3 top-18 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-[#163D5C]" />
                      <h4 className="text-xs font-bold text-slate-900">Bildirishnomalar</h4>
                    </div>
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        {pendingCount} ta yangi
                      </span>
                    )}
                  </div>

                  <div className="p-4 max-h-[360px] overflow-y-auto">
                    {pendingCount > 0 ? (
                      <div className="space-y-3">
                        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900">
                              Tekshiruv kutilayotgan soʻrovnomalar
                            </p>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              Fuqarolar tomonidan onlayn toʻldirilgan yoki tekshiruvga yuborilgan{' '}
                              <strong className="text-amber-800 font-bold">{pendingCount} ta</strong> anketa koʻrib chiqishni kutmoqda.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsNotifOpen(false);
                            navigate('/review-queue');
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-[#163D5C] hover:bg-[#11314a] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <span>Tekshiruv navbatiga oʻtish</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Yangi bildirishnomalar yoʻq</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Barcha anketalar va maʼlumotlar toʻliq tasdiqlangan
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                </>
              )}
            </div>

            {/* Xodim kartasi (Screenshot 2-3 uslubi) */}
            <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l-2 border-slate-200 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#163D5C] text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left flex-shrink-0">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {user?.fullName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {user?.roleCode === 'MAHALLA_OPERATOR'
                    ? 'Mahalla yetakchisi'
                    : user?.roleCode === 'DISTRICT_ADMIN'
                    ? 'Tuman boshligʻi'
                    : user?.roleCode === 'DATA_REVIEWER'
                    ? 'Data Reviewer'
                    : 'Super Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Sahifa ichki qismi */}
        <main className="p-3.5 sm:p-6 md:p-8 flex-1 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Real-time Toast Bildirishnoma (Onlayn ariza yuborilganda darhol chiqadi) */}
      {latestRealtimeEvent && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-[#163D5C]/30 p-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#163D5C] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#163D5C]/30">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <h5 className="text-xs font-bold text-slate-900 tracking-tight">
                  Yangi onlayn soʻrovnoma!
                </h5>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                {latestRealtimeEvent.citizenFullName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {latestRealtimeEvent.mahallaName ? `${latestRealtimeEvent.mahallaName} MFY` : ((latestRealtimeEvent as any).districtName || navAreaBadgeText)}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLatestRealtimeEvent(null);
                    navigate('/review-queue');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#163D5C] hover:bg-[#11314a] text-white font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>Koʻrib chiqish</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setLatestRealtimeEvent(null)}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-[11px] font-semibold cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLatestRealtimeEvent(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
