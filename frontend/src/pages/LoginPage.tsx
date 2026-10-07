import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2, Layers } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Iltimos, login va parolni kiriting');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const loggedInUser = await login({
        username: username.trim(),
        password: password.trim(),
      });

      toast.success(
        `Xush kelibsiz, ${loggedInUser?.fullName || 'foydalanuvchi'}! Tizimga muvaffaqiyatli kirdingiz.`,
      );

      // Roliga qarab tegishli kabinetga yo'naltirish
      if (loggedInUser?.role === 'MAHALLA_OPERATOR') {
        navigate('/new-survey');
      } else if (loggedInUser?.role === 'DATA_REVIEWER') {
        navigate('/review-queue');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Login yoki parol notoʻgʻri kiritildi';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8 sm:py-12 select-none">
      <div className="w-full max-w-[420px] space-y-5 sm:space-y-6">
        {/* Brand Logo & Sarlavha */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#163D5C] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#163D5C]/25">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#163D5C]">
            Bandlik Monitoring
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Yoshlar bandlik holatini oʻrganish yagona axborot tizimi
          </p>
        </div>

        {/* Karta (Card) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/70 p-6 sm:p-8">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-base font-bold text-slate-900">Tizimga kirish</h2>
            <p className="text-xs text-slate-400">Xizmat faoliyatingiz kabinetiga ulaning</p>
          </div>

          {error && (
            <div className="flex items-center p-3 mb-5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Foydalanuvchi logini
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Loginingizni kiriting"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-2 focus:ring-[#163D5C]/15 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Maxfiy parol
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Parolni kiriting..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-2 focus:ring-[#163D5C]/15 transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition cursor-pointer"
                  title={showPassword ? 'Parolni yashirish' : 'Parolni koʻrsatish'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 sm:py-3 px-4 rounded-xl text-sm sm:text-xs font-bold text-white bg-[#163D5C] hover:bg-[#11314a] active:scale-[0.99] focus:outline-none shadow-md shadow-[#163D5C]/20 transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Tekshirilmoqda...</span>
                  </>
                ) : (
                  <span>Kabinetga Kirish</span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-[11px] text-slate-400 font-medium">
          Davlat axborot xavfsizligi talablariga muvofiq himoyalangan
        </div>
      </div>
    </div>
  );
};
