import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { Mahalla, District } from '../types/monitoring.types';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Building,
  Plus,
  Trash2,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  Search,
} from 'lucide-react';
import { formatMahallaName } from '../utils/formatters';
import { useAreaFilter } from '../context/AreaFilterContext';

export const MahallasManagementPage: React.FC = () => {
  const { user, isSuperAdmin, isDistrictAdmin } = useAuth();
  const { selectedDistrictId: globalDistrictId } = useAreaFilter();

  const [activeTab, setActiveTab] = useState<'MAHALLAS' | 'DISTRICTS'>('MAHALLAS');
  const [mahallas, setMahallas] = useState<Mahalla[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mahallaPage, setMahallaPage] = useState<number>(1);
  const [districtPage, setDistrictPage] = useState<number>(1);

  // Mahalla qo'shish modal
  const [showAddMahallaModal, setShowAddMahallaModal] = useState(false);
  const [mahallaName, setMahallaName] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [mahallaCode, setMahallaCode] = useState('');

  // Tuman qo'shish modal (Faqat Super Admin)
  const [showAddDistrictModal, setShowAddDistrictModal] = useState(false);
  const [districtName, setDistrictName] = useState('');
  const [districtRegion, setDistrictRegion] = useState('');
  const [districtCode, setDistrictCode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, dRes] = await Promise.all([
        monitoringApi.getMahallas({
          districtId: globalDistrictId || undefined,
          limit: 500,
        }),
        isSuperAdmin ? monitoringApi.getDistricts() : Promise.resolve([]),
      ]);
      setMahallas(mRes.items);
      setDistricts(dRes);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setMahallaPage(1);
    setDistrictPage(1);
  }, [isSuperAdmin, globalDistrictId]);

  useEffect(() => {
    setMahallaPage(1);
    setDistrictPage(1);
  }, [searchQuery, activeTab]);

  const handleCreateMahalla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mahallaName.trim()) {
      setError('Iltimos, mahalla nomini kiriting');
      return;
    }

    const targetDistrictId = isDistrictAdmin ? user?.districtId : selectedDistrictId;
    if (!targetDistrictId) {
      setError('Iltimos, mahallaga tegishli tumanni tanlang');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await monitoringApi.createMahalla({
        name: mahallaName.trim(),
        districtId: targetDistrictId,
        code: mahallaCode.trim() || undefined,
      } as any);
      setShowAddMahallaModal(false);
      setMahallaName('');
      setMahallaCode('');
      setSelectedDistrictId('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Mahallani qo\'shishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtName.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await monitoringApi.createDistrict({
        name: districtName.trim(),
        region: districtRegion.trim() || 'Namangan viloyati',
        code: districtCode.trim() || undefined,
      });
      setShowAddDistrictModal(false);
      setDistrictName('');
      setDistrictRegion('');
      setDistrictCode('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Tumanni qo\'shishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMahalla = async (id: string, mName: string) => {
    if (!confirm(`"${mName}" mahallasini o'chirishga ishonchingiz komilmi?`)) {
      return;
    }
    try {
      await monitoringApi.deleteMahalla(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'O\'chirishda xatolik yuz berdi');
    }
  };

  const filteredMahallas = mahallas.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (m.name || '').toLowerCase().includes(q);
    const districtName =
      typeof m.district === 'object' && m.district !== null
        ? (m.district as any).name || ''
        : typeof m.district === 'string'
        ? m.district
        : '';
    const codeMatch = (m.code || '').toLowerCase().includes(q);
    const distMatch = districtName.toLowerCase().includes(q);
    return nameMatch || codeMatch || distMatch;
  });

  const filteredDistricts = districts.filter((d) => {
    if (globalDistrictId && d.id !== globalDistrictId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (d.name || '').toLowerCase().includes(q);
    const regionMatch = (d.region || '').toLowerCase().includes(q);
    const codeMatch = (d.code || '').toLowerCase().includes(q);
    return nameMatch || regionMatch || codeMatch;
  });

  return (
    <DashboardLayout
      title="Hududlar & Mahallalar Boshqaruvi"
      breadcrumbs={['Sahifalar', 'Maʻmuriyat', 'Mahallalar']}
      searchValue={searchQuery}
      onSearch={setSearchQuery}
      searchPlaceholder="Mahalla yoki tumanni qidirish..."
    >
      <div className="space-y-6">
        {/* Yuqori Tab va Harakatlar paneli */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tablar (Super Admin uchun Tuman va Mahalla) */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('MAHALLAS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'MAHALLAS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Mahallalar ({mahallas.length})
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('DISTRICTS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'DISTRICTS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tumanlar ({districts.length})
              </button>
            )}
          </div>

          {/* Promoy (jonli) qidiruv va Qo'shish tugmalari */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={activeTab === 'MAHALLAS' ? 'Mahalla qidirish...' : 'Tuman qidirish...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
                  title="Tozalash"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2.5">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDistrictName('');
                    setDistrictRegion('');
                    setDistrictCode('');
                    setError(null);
                    setShowAddDistrictModal(true);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Yangi Tuman</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedDistrictId(isDistrictAdmin ? user?.districtId || '' : (globalDistrictId || ''));
                  setMahallaName('');
                  setMahallaCode('');
                  setError(null);
                  setShowAddMahallaModal(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Yangi Mahalla</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 1. MAHALLALAR RO'YXATI JADVALI */}
        {/* ======================================================== */}
        {activeTab === 'MAHALLAS' && (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  {isSuperAdmin
                    ? (globalDistrictId
                        ? `${districts.find((d) => d.id === globalDistrictId)?.name || 'Tanlangan tuman'} mahallalari`
                        : 'Barcha mahallalar (Viloyat boʻyicha)')
                    : `${user?.districtName || 'Tuman'} mahallalari`}
                </h4>
                <p className="text-xs text-slate-400">
                  Biriktirilgan operatorlar va yoshlar xatlovi hududlari ({filteredMahallas.length} ta)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-5">Mahalla Nomi</th>
                    <th className="py-3.5 px-4">Tuman</th>
                    <th className="py-3.5 px-4">Kodi</th>
                    <th className="py-3.5 px-4">Biriktirilgan Operatorlar</th>
                    {isSuperAdmin && <th className="py-3.5 px-5 text-right">Amal</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMahallas.length > 0 ? (
                    filteredMahallas
                      .slice((mahallaPage - 1) * 10, mahallaPage * 10)
                      .map((m: any, idx: number) => (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                            {(mahallaPage - 1) * 10 + idx + 1}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <span>{formatMahallaName(m.name)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {m.district?.name || m.district || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {m.code || '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            {m.operators && m.operators.length > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                                {m.operators.map((o: any) => o.fullName).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Biriktirilmagan</span>
                            )}
                          </td>
                          {isSuperAdmin && (
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMahalla(m.id, m.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Oʻchirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 font-medium text-xs">
                        {loading ? 'Yuklanmoqda...' : 'Mahallalar topilmadi'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Sahifalash (Pagination) */}
            {!loading && filteredMahallas.length > 0 && (
              <Pagination
                currentPage={mahallaPage}
                totalItems={filteredMahallas.length}
                pageSize={10}
                onPageChange={(p) => setMahallaPage(p)}
              />
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. TUMANLAR RO'YXATI JADVALI (Faqat Super Admin) */}
        {/* ======================================================== */}
        {isSuperAdmin && activeTab === 'DISTRICTS' && (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  Tizimdagi Tumanlar & Shaharlar
                </h4>
                <p className="text-xs text-slate-400">
                  Har bir tuman mustaqil koordinator va mahallalar zanjiriga ega ({filteredDistricts.length} ta)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-5">Tuman Nomi</th>
                    <th className="py-3.5 px-4">Viloyat</th>
                    <th className="py-3.5 px-4">Qisqa Kodi</th>
                    <th className="py-3.5 px-4">Mahallalar Soni</th>
                    <th className="py-3.5 px-4">Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDistricts.length > 0 ? (
                    filteredDistricts
                      .slice((districtPage - 1) * 10, districtPage * 10)
                      .map((d: any, idx: number) => (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                            {(districtPage - 1) * 10 + idx + 1}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                              <Building className="w-3.5 h-3.5" />
                            </div>
                            <span>{d.name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{d.region}</td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-500">
                            {d.code || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-600">
                            {d.mahallas?.length || 0} ta mahalla
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Faol
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 font-medium text-xs">
                        {loading ? 'Yuklanmoqda...' : 'Tumanlar topilmadi'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Sahifalash (Pagination) */}
            {!loading && filteredDistricts.length > 0 && (
              <Pagination
                currentPage={districtPage}
                totalItems={filteredDistricts.length}
                pageSize={10}
                onPageChange={(p) => setDistrictPage(p)}
              />
            )}
          </div>
        )}

        {/* Modal: Yangi Mahalla Qo'shish */}
        {showAddMahallaModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">Yangi Mahalla Qoʻshish</h4>
                <button
                  type="button"
                  onClick={() => setShowAddMahallaModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateMahalla} className="space-y-4">
                {isSuperAdmin && (
                  <div>
                    <CustomSelect
                      label="Qaysi tumanga tegishli"
                      required
                      searchable={true}
                      placeholder="Tumanni tanlang..."
                      value={selectedDistrictId}
                      onChange={(val) => setSelectedDistrictId(val)}
                      options={districts.map((d) => ({
                        value: d.id,
                        label: d.name,
                        sublabel: d.region,
                      }))}
                    />
                  </div>
                )}

                <Input
                  label="Mahalla nomi (MFY)"
                  required
                  placeholder="Masalan: Yuksalish"
                  value={mahallaName}
                  onChange={(e) => setMahallaName(e.target.value)}
                />

                <Input
                  label="Mahalla identifikatsiya kodi (ixtiyoriy)"
                  placeholder="Masalan: 1714234"
                  value={mahallaCode}
                  onChange={(e) => setMahallaCode(e.target.value)}
                />

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddMahallaModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Yangi Tuman Qo'shish (Faqat Super Admin) */}
        {showAddDistrictModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">Yangi Tuman / Shahar Qoʻshish</h4>
                <button
                  type="button"
                  onClick={() => setShowAddDistrictModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateDistrict} className="space-y-4">
                <Input
                  label="Tuman nomi"
                  required
                  placeholder="Masalan: Chortoq tumani"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                />

                <Input
                  label="Viloyat"
                  required
                  placeholder="Masalan: Namangan viloyati"
                  value={districtRegion}
                  onChange={(e) => setDistrictRegion(e.target.value)}
                />

                <Input
                  label="Qisqa kodi (ixtiyoriy)"
                  placeholder="Masalan: CHO"
                  value={districtCode}
                  onChange={(e) => setDistrictCode(e.target.value)}
                />

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddDistrictModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Saqlanmoqda...' : 'Tumanni Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
