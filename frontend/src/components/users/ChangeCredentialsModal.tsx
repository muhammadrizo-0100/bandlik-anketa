import React, { useState } from 'react';
import { User } from '../../types/auth.types';
import { monitoringApi } from '../../api/monitoring.api';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, X, Loader2, AlertCircle } from 'lucide-react';

interface ChangeCredentialsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [username, setUsername] = useState(user.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError('Foydalanuvchi logini boʻsh boʻlishi mumkin emas');
      return;
    }

    if (password && password.length < 6) {
      setError('Yangi parol kamida 6 ta belgidan iborat boʻlishi shart');
      return;
    }

    if (cleanUsername === user.username && !password) {
      setError('Hech qanday oʻzgarish kiritilmadi');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const updatePayload: any = {};
      if (cleanUsername !== user.username) {
        updatePayload.username = cleanUsername;
      }
      if (password) {
        updatePayload.password = password;
      }

      const res = await monitoringApi.updateUser(user.id, updatePayload);
      toast.success(
        `"${user.fullName}" xodimining login/paroli muvaffaqiyatli yangilandi`,
      );
      onSuccess(res as any);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kirish maʼlumotlarini yangilashda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-6 animate-in zoom-in-95 duration-150">
        {/* Sarlavha qismi (2-rasmdagidek ortiqcha piktogrammalarsiz) */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Xodim login va paroli
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Yangi maʼlumotlarni xodimga xavfsiz yetkazing. Parol keyin koʻrsatilmaydi.
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
          {/* 1. Login */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Login <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Foydalanuvchi logini..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
            />
          </div>

          {/* 2. Yangi parol */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Yangi parol
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                className="w-full px-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title={showPassword ? 'Parolni yashirish' : 'Parolni koʻrsatish'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tugmalar */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#163D5C] hover:bg-[#11314a] focus:outline-none shadow-xs transition disabled:opacity-60 flex items-center space-x-2 cursor-pointer"
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
