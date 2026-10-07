import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { User, UserRole } from '../types/auth.types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatUzPhone } from '../utils/validators';
import { formatMahallaName } from '../utils/formatters';
import { ChangeCredentialsModal } from '../components/users/ChangeCredentialsModal';
import { EditUserModal } from '../components/users/EditUserModal';
import { DeleteUserModal } from '../components/users/DeleteUserModal';
import {
  ArrowLeft,
  KeyRound,
  Pencil,
  Trash2,
  Building2,
  MapPin,
  Phone,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modallar holati
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchUser = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await monitoringApi.getUserById(id);
      setUser(res);
    } catch (err: any) {
      setError(err.message || 'Xodim maʼlumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const getRoleBadge = (targetUser: User) => {
    const roleCode = targetUser.roleCode || targetUser.role;
    switch (roleCode) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#163D5C] text-white shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </span>
        );
      case 'DISTRICT_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Tuman Boshligʻi</span>
          </span>
        );
      case 'MAHALLA_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mahalla Yetakchisi</span>
          </span>
        );
      case 'DATA_REVIEWER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Maʼlumot Tekshiruvchi</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
            {targetUser.roleName || roleCode}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Xodim Profili"
        breadcrumbs={['Sahifalar', 'Xodimlar & Rollar', 'Yuklanmoqda...']}
      >
        <div className="flex flex-col items-center justify-center p-24 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#163D5C] mb-3" />
          <p className="text-xs font-medium text-slate-600">Xodim maʼlumotlari yuklanmoqda...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout
        title="Xodim topilmadi"
        breadcrumbs={['Sahifalar', 'Xodimlar & Rollar', 'Xatolik']}
      >
        <div className="bg-white rounded-3xl p-10 text-center max-w-lg mx-auto border border-slate-200 shadow-2xs space-y-4 my-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Xodim maʼlumotlari topilmadi</h3>
            <p className="text-xs text-slate-500">{error || 'Bunday xodim tizimda mavjud emas yoki oʻchirilgan'}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#163D5C] text-white text-xs font-bold hover:bg-[#11314a] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Xodimlar roʻyxatiga qaytish</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isSelf = currentUser?.id === user.id;

  return (
    <DashboardLayout
      title={user.fullName}
      subtitle={`${user.roleName || user.roleCode || user.role} boʻyicha toʻliq maʼlumotlar`}
      breadcrumbs={['Sahifalar', 'Xodimlar & Rollar', user.fullName]}
    >
      <div className="space-y-6 max-w-6xl">
        {/* 1. Yuqori Navigatsiya va Amallar paneli (Screenshot 2 uslubi) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          {/* Orqaga tugmasi */}
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Orqaga</span>
          </button>

          {/* O'ng tomon Amallar (Actions) */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Faqat Super Admin uchun: Login va parol berish */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>Login va parol</span>
              </button>
            )}

            {/* Tahrirlash tugmasi */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Tahrirlash</span>
            </button>

            {/* O'chirish tugmasi (faqat Super Admin va o'zini o'zi emas) */}
            {isSuperAdmin && !isSelf && user.roleCode !== 'SUPER_ADMIN' && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Oʻchirish</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Profil Sarlavhasi Kartasi (Banner Card) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              {/* Avatar (2-rasmdagidek doira) */}
              <div className="w-16 h-16 rounded-full bg-[#163D5C] text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
                {user.fullName.charAt(0).toUpperCase()}
              </div>

              {/* Ism, Rol, Login */}
              <div className="space-y-1.5">
                <div className="flex items-center flex-wrap gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {user.fullName}
                  </h2>
                  {getRoleBadge(user)}
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Faol
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Muzlatilgan
                    </span>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                    @{user.username}
                  </span>
                  {user.phone && (
                    <span className="inline-flex items-center gap-1 font-mono text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {formatUzPhone(user.phone)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pastki Meta ma'lumotlar: Yaratilgan va Yangilangan vaqti (ID olib tashlandi) */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Yaratilgan
              </span>
              <span className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(user.createdAt)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Yangilangan
              </span>
              <span className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(user.updatedAt)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Biriktirilgan hudud
              </span>
              <span className="font-semibold text-slate-700 mt-0.5 block truncate">
                {user.mahallaName
                  ? `${formatMahallaName(user.mahallaName)} (${user.districtName || 'Tuman'})`
                  : user.districtName || 'Viloyat miqyosida'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Tafsilotlar Kartalari (2-rasmdagi struktura bo'yicha) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Karta 1: Asosiy shaxsiy ma'lumotlar */}
          {/* Karta 1: Asosiy shaxsiy ma'lumotlar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Asosiy maʼlumotlar</h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Toʻliq F.I.Sh.</span>
                <span className="font-bold text-slate-900">{user.fullName}</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Foydalanuvchi logini</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                  @{user.username}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Telefon raqami</span>
                <span className="font-mono font-bold text-slate-800">
                  {user.phone ? formatUzPhone(user.phone) : '—'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Lavozimi (Roli)</span>
                <span className="font-bold text-slate-900">
                  {user.roleName || user.roleCode || user.role}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Hisob holati</span>
                {user.isActive ? (
                  <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Faol</span>
                  </span>
                ) : (
                  <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Muzlatilgan</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Karta 2: Biriktirilgan hudud va Faoliyat statistikasi */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Hudud va Faoliyat maʼlumotlari</h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Viloyat</span>
                <span className="font-bold text-slate-900">Namangan viloyati</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Biriktirilgan tuman</span>
                <span className="font-bold text-slate-900">
                  {user.districtName || 'Barcha tumanlar miqyosida'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Biriktirilgan mahalla (MFY)</span>
                <span className="font-bold text-slate-900">
                  {user.mahallaName ? formatMahallaName(user.mahallaName) : 'Biriktirilmagan'}
                </span>
              </div>

              {/* Faoliyat natijalari / KPI */}
              {user.roleCode === 'MAHALLA_OPERATOR' && (
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Oʻtkazgan soʻrovnomalari</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                    {user.surveysCount || 0} ta anketa
                  </span>
                </div>
              )}

              {user.roleCode === 'DATA_REVIEWER' && (
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Koʻrib chiqqan arizalari</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                    {user.reviewedCount || 0} ta tekshiruv
                  </span>
                </div>
              )}

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Tizim vakolati</span>
                <span className="font-semibold text-slate-700">
                  {user.roleCode === 'SUPER_ADMIN'
                    ? 'Toʻliq maʼmuriy nazorat'
                    : user.roleCode === 'DISTRICT_ADMIN'
                    ? 'Tuman hududiy boshqaruvi'
                    : user.roleCode === 'MAHALLA_OPERATOR'
                    ? 'Xatlov va anketa kiritish'
                    : 'Arizalarni tekshirish va tasdiqlash'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modallar */}
      {/* 1. Login va parol modali */}
      <ChangeCredentialsModal
        user={user}
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        onSuccess={(updated) => {
          setUser((prev) => (prev ? { ...prev, username: updated.username } : null));
        }}
      />

      {/* 2. Xodim tahrirlash modali */}
      <EditUserModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => {
          setUser((prev) => (prev ? { ...prev, ...updated } : null));
        }}
      />

      {/* 3. O'chirish tasdiqlash modali */}
      <DeleteUserModal
        user={user}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          navigate('/users');
        }}
      />
    </DashboardLayout>
  );
};
