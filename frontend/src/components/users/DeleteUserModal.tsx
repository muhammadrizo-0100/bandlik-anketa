import React, { useState } from 'react';
import { User } from '../../types/auth.types';
import { monitoringApi } from '../../api/monitoring.api';
import { useToast } from '../../context/ToastContext';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedUserId: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await monitoringApi.deleteUser(user.id);
      toast.success(`"${user.fullName}" tizimdan muvaffaqiyatli oʻchirildi`);
      onSuccess(user.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xodimni oʻchirishda xatolik yuz berdi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
        {/* Qizil belgi */}
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-5 h-5" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            Xodimni oʻchirishni tasdiqlaysizmi?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Haqiqatan ham <b className="text-slate-800">"{user.fullName}"</b> ({user.roleName || user.roleCode || user.role}) hisobini oʻchirmoqchimisiz? Ushbu amalni ortga qaytarib boʻlmaydi.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Bekor qilish
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Ha, oʻchirish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
