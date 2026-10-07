import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/auth.types';
import { District, Mahalla } from '../../types/monitoring.types';
import { monitoringApi } from '../../api/monitoring.api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { CustomSelect } from '../ui/CustomSelect';
import { formatUzPhone, isValidUzPhone } from '../../utils/validators';
import { formatMahallaName } from '../../utils/formatters';
import {
  Pencil,
  X,
  Loader2,
  AlertCircle,
  Building2,
  Users as UsersIcon,
  Phone,
  CheckCircle2,
} from 'lucide-react';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
  districts?: District[];
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
  districts: propDistricts,
}) => {
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  // Ism va familiyani ajratish
  const nameParts = (user.fullName || '').split(' ');
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(user.phone ? formatUzPhone(user.phone) : '');
  const [isActive, setIsActive] = useState<boolean>(user.isActive !== false);
  const [districtId, setDistrictId] = useState<string>(user.districtId || '');
  const [mahallaId, setMahallaId] = useState<string>(user.mahallaId || '');
  
  const [districts, setDistricts] = useState<District[]>(propDistricts || []);
  const [mahallas, setMahallas] = useState<Mahalla[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal ochilganda qiymatlarni qayta yuklash
  useEffect(() => {
    if (isOpen) {
      const parts = (user.fullName || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setPhone(user.phone ? formatUzPhone(user.phone) : '');
      setIsActive(user.isActive !== false);
      setDistrictId(user.districtId || '');
      setMahallaId(user.mahallaId || '');
      setError(null);

      // Dropdownlarni yangilash
      if (!propDistricts || propDistricts.length === 0) {
        monitoringApi.getDistrictsDropdown().then((d) => setDistricts(d as any)).catch(() => {});
      }
      if (user.districtId) {
        monitoringApi.getMahallasDropdown(user.districtId).then((m) => setMahallas(m as any)).catch(() => {});
      }
    }
  }, [isOpen, user]);

  const handleDistrictChange = (newDistId: string) => {
    setDistrictId(newDistId);
    setMahallaId('');
    if (newDistId) {
      monitoringApi.getMahallasDropdown(newDistId).then((m) => setMahallas(m as any)).catch(() => {});
    } else {
      setMahallas([]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ism va familiya kiritilishi majburiy');
      return;
    }

    if (!phone.trim() || !isValidUzPhone(phone)) {
      setError('Telefon raqami kiritilishi majburiy. Format: +998 (XX) XXX-XX-XX');
      return;
    }

    const fullFullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      setSubmitting(true);
      setError(null);

      const payload: any = {
        fullName: fullFullName,
        phone: phone.trim(),
        isActive,
      };

      // Tuman va Mahalla o'zgarishi (agar Super Admin bo'lsa)
      if (isSuperAdmin) {
        if (user.roleCode === 'DISTRICT_ADMIN') {
          payload.districtId = districtId || undefined;
        } else if (user.roleCode === 'MAHALLA_OPERATOR') {
          payload.districtId = districtId || undefined;
          payload.mahallaId = mahallaId || undefined;
        }
      }

      const res = await monitoringApi.updateUser(user.id, payload);
      toast.success(`"${fullFullName}" maʼlumotlari muvaffaqiyatli saqlandi`);
      onSuccess(res as any);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xodim maʼlumotlarini saqlashda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-6 animate-in zoom-in-95 duration-150">
        {/* Sarlavha qismi */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Xodim maʼlumotlarini tahrirlash
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {user.fullName} ({user.roleName || user.roleCode || user.role})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Xatolik xabari */}
        {error && (
          <div className="mb-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Ism */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ism <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Masalan: Sardor"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
              />
            </div>

            {/* 2. Familiya */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Familiya <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Masalan: Qodirov"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
              />
            </div>

            {/* 3. Telefon raqami */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Telefon raqami <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                placeholder="+998 (90) 123-45-67"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
              />
            </div>
          </div>

          {/* 5. Hududlar (Faqat Super Admin bo'lsa va tuman/mahalla xodimi bo'lsa) */}
          {isSuperAdmin && (user.roleCode === 'DISTRICT_ADMIN' || user.roleCode === 'MAHALLA_OPERATOR') && (
            <div className="space-y-3 pt-1">
              <div>
                <CustomSelect
                  label="Biriktirilgan tuman"
                  searchable={true}
                  placeholder="Tumanni tanlang..."
                  value={districtId}
                  onChange={handleDistrictChange}
                  options={districts.map((d: any) => ({
                    value: d.id,
                    label: d.name,
                    sublabel: d.region,
                  }))}
                />
              </div>

              {user.roleCode === 'MAHALLA_OPERATOR' && (
                <div>
                  <CustomSelect
                    label="Biriktirilgan mahalla (MFY)"
                    searchable={true}
                    placeholder={districtId ? 'Mahallani tanlang...' : 'Avval tumanni tanlang'}
                    disabled={!districtId}
                    value={mahallaId}
                    onChange={(val) => setMahallaId(val)}
                    options={mahallas.map((m: any) => ({
                      value: m.id,
                      label: formatMahallaName(m.name),
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* 6. Holati (Faol / Muzlatilgan) */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Hisob faolligi
            </label>
            <p className="text-[11px] text-slate-400 mb-2.5 font-normal">
              Xodimning tizimga kirishini vaqtincha muzlatish (bloklash) yoki qayta faollashtirish
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/15'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Faol holatda</span>
              </button>

              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                  !isActive
                    ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-500/15'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Nofaol (Muzlatilgan)</span>
              </button>
            </div>
          </div>

          {/* Tugmalar */}
          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#163D5C] hover:bg-[#11314a] focus:outline-none shadow-xs transition disabled:opacity-60 flex items-center space-x-2 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
