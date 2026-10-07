import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newItem: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newItem]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const toast = {
    success: (message: string, title?: string) => addToast('success', message, title || 'Muvaffaqiyatli'),
    error: (message: string, title?: string) => addToast('error', message, title || 'Xatolik'),
    warning: (message: string, title?: string) => addToast('warning', message, title || 'Diqqat'),
    info: (message: string, title?: string) => addToast('info', message, title || 'Maʼlumot'),
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          card: 'bg-white border-emerald-200/90 shadow-emerald-500/10',
          iconBg: 'bg-emerald-100 text-emerald-600',
          title: 'text-emerald-900',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        };
      case 'error':
        return {
          card: 'bg-white border-rose-200/90 shadow-rose-500/10',
          iconBg: 'bg-rose-100 text-rose-600',
          title: 'text-rose-900',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
        };
      case 'warning':
        return {
          card: 'bg-white border-amber-200/90 shadow-amber-500/10',
          iconBg: 'bg-amber-100 text-amber-600',
          title: 'text-amber-900',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        };
      case 'info':
      default:
        return {
          card: 'bg-white border-slate-200/90 shadow-slate-500/10',
          iconBg: 'bg-[#163D5C]/10 text-[#163D5C]',
          title: 'text-[#163D5C]',
          icon: <Info className="w-5 h-5 text-[#163D5C] shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Floating Toasts Container */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const style = getToastStyles(t.type);
          return (
            <div
              key={t.id}
              className={`pointer-events-auto w-full p-4 rounded-2xl border shadow-xl flex items-start gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${style.card}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${style.iconBg}`}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                {t.title && (
                  <h4 className={`text-xs font-bold leading-none mb-1 ${style.title}`}>
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
