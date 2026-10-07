import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Textarea } from '../components/ui/Textarea';
import { monitoringApi } from '../api/monitoring.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  SurveyMethod,
  EmploymentCategory,
  NoWishReason,
  UnemployedDirection,
  Mahalla,
} from '../types/monitoring.types';
import {
  formatUzPhone,
  isValidUzPhone,
  isValidFullName,
  isValidPinfl,
  isValidYouthAge,
  calculateAge,
  hasLetters,
  extractBirthDateFromPinfl,
} from '../utils/validators';
import {
  Building2,
  Calendar,
  User,
  Hash,
  MapPin,
  GraduationCap,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  FileCheck,
  Home,
  UserCheck,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { useAreaFilter } from '../context/AreaFilterContext';

const getInitialOperatorDraft = () => {
  try {
    const raw = localStorage.getItem('operator_survey_draft');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const NewSurveyPage: React.FC = () => {
  const { user, isMahallaOperator, isDistrictAdmin, isSuperAdmin } = useAuth();
  const { selectedDistrictId: globalDistrictId, selectedMahallaId: globalMahallaId, currentDistrictName } = useAreaFilter();
  const toast = useToast();
  const navigate = useNavigate();

  const initialDraft = React.useMemo(() => getInitialOperatorDraft(), []);

  const [step, setStep] = useState<number>(initialDraft?.step || 1);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    initialDraft?.selectedDistrictId || (isSuperAdmin ? globalDistrictId || '' : user?.districtId || ''),
  );
  const [mahallas, setMahallas] = useState<Mahalla[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pinflChecking, setPinflChecking] = useState(false);
  const [pinflWarning, setPinflWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ isConflict: boolean; message: string } | null>(null);

  // Form State
  const [mahallaId, setMahallaId] = useState<string>(
    initialDraft?.mahallaId || (isMahallaOperator ? user?.mahallaId || '' : globalMahallaId || ''),
  );
  const [surveyMethod, setSurveyMethod] = useState<SurveyMethod>(
    initialDraft?.surveyMethod || 'HOME_VISIT',
  );
  const [surveyDate, setSurveyDate] = useState<string>(
    initialDraft?.surveyDate || new Date().toISOString().split('T')[0],
  );

  const [fullName, setFullName] = useState<string>(initialDraft?.fullName || '');
  const [birthDate, setBirthDate] = useState<string>(initialDraft?.birthDate || '');
  const [pinfl, setPinfl] = useState<string>(initialDraft?.pinfl || '');
  const [address, setAddress] = useState<string>(initialDraft?.address || '');
  const [education, setEducation] = useState<string>(initialDraft?.education || '');
  const [phone, setPhone] = useState<string>(initialDraft?.phone || '');
  const [parentPhone, setParentPhone] = useState<string>(initialDraft?.parentPhone || '');
  const [specialty, setSpecialty] = useState<string>(initialDraft?.specialty || '');

  const [mainCategory, setMainCategory] = useState<EmploymentCategory>(
    initialDraft?.mainCategory || 'OFFICIALLY_EMPLOYED',
  );
  const [officialWorkplace, setOfficialWorkplace] = useState<string>(
    initialDraft?.officialWorkplace || '',
  );
  const [selfEmployedActivity, setSelfEmployedActivity] = useState<string>(
    initialDraft?.selfEmployedActivity || '',
  );
  const [selfEmployedRegistered, setSelfEmployedRegistered] = useState<boolean>(
    initialDraft?.selfEmployedRegistered || false,
  );
  const [unofficialActivityType, setUnofficialActivityType] = useState<string>(
    initialDraft?.unofficialActivityType || '',
  );
  const [migrantCountry, setMigrantCountry] = useState<string>(
    initialDraft?.migrantCountry || '',
  );
  const [migrantDuration, setMigrantDuration] = useState<string>(
    initialDraft?.migrantDuration || '',
  );
  const [noWishReason, setNoWishReason] = useState<NoWishReason>(
    initialDraft?.noWishReason || 'CHILD_CARE',
  );
  const [unemployedDirections, setUnemployedDirections] = useState<UnemployedDirection[]>(
    initialDraft?.unemployedDirections || ['PERMANENT_JOB'],
  );
  const [unemployedAdditionalNote, setUnemployedAdditionalNote] = useState<string>(
    initialDraft?.unemployedAdditionalNote || '',
  );
  const [otherReasonNote, setOtherReasonNote] = useState<string>(
    initialDraft?.otherReasonNote || '',
  );

  const [citizenSigned, setCitizenSigned] = useState<boolean>(
    initialDraft?.citizenSigned !== undefined ? initialDraft.citizenSigned : true,
  );
  const [operatorSigned, setOperatorSigned] = useState<boolean>(
    initialDraft?.operatorSigned !== undefined ? initialDraft.operatorSigned : true,
  );

  // Yosh chegarasi: 18 - 60 yosh
  const { maxBirthDate, minBirthDate } = useMemo(() => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate());
    return {
      maxBirthDate: maxDate.toISOString().split('T')[0],
      minBirthDate: minDate.toISOString().split('T')[0],
    };
  }, []);

  const citizenAge = useMemo(() => {
    return calculateAge(birthDate);
  }, [birthDate]);

  // Avtomatik qoralamani saqlash (Auto-save draft)
  useEffect(() => {
    if (result) return;

    const hasData =
      Boolean(fullName.trim()) ||
      Boolean(birthDate) ||
      Boolean(pinfl.trim()) ||
      Boolean(address.trim()) ||
      Boolean(phone.trim()) ||
      Boolean(education.trim());

    if (!hasData) return;

    const timer = setTimeout(() => {
      const draft = {
        step,
        selectedDistrictId,
        mahallaId,
        surveyMethod,
        surveyDate,
        fullName,
        birthDate,
        pinfl,
        address,
        education,
        phone,
        parentPhone,
        specialty,
        mainCategory,
        officialWorkplace,
        selfEmployedActivity,
        selfEmployedRegistered,
        unofficialActivityType,
        migrantCountry,
        migrantDuration,
        noWishReason,
        unemployedDirections,
        unemployedAdditionalNote,
        otherReasonNote,
        citizenSigned,
        operatorSigned,
      };
      localStorage.setItem('operator_survey_draft', JSON.stringify(draft));
    }, 400);

    return () => clearTimeout(timer);
  }, [
    result,
    step,
    selectedDistrictId,
    mahallaId,
    surveyMethod,
    surveyDate,
    fullName,
    birthDate,
    pinfl,
    address,
    education,
    phone,
    parentPhone,
    specialty,
    mainCategory,
    officialWorkplace,
    selfEmployedActivity,
    selfEmployedRegistered,
    unofficialActivityType,
    migrantCountry,
    migrantDuration,
    noWishReason,
    unemployedDirections,
    unemployedAdditionalNote,
    otherReasonNote,
    citizenSigned,
    operatorSigned,
  ]);

  // User ma'lumotlari yangilanganda avtomatik moslash
  useEffect(() => {
    if (user?.districtId && !selectedDistrictId && !isSuperAdmin) {
      setSelectedDistrictId(user.districtId);
    }
    if (isMahallaOperator && user?.mahallaId) {
      setMahallaId(user.mahallaId);
    }
  }, [user, isMahallaOperator, isSuperAdmin]);

  // Super Admin uchun barcha tumanlar ro'yxatini yuklash
  useEffect(() => {
    if (isSuperAdmin) {
      monitoringApi
        .getDistrictsDropdown()
        .then((data) => {
          setDistricts(data);
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  // Tanlangan tuman bo'yicha mahallalar ro'yxatini yuklash
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    const districtIdToFetch = isSuperAdmin ? selectedDistrictId : user?.districtId;
    if (districtIdToFetch) {
      if (!isInitialMount.current && isSuperAdmin) {
        setMahallaId('');
      } else {
        isInitialMount.current = false;
      }
      monitoringApi
        .getMahallasDropdown(districtIdToFetch)
        .then((data) => setMahallas(data as any))
        .catch(() => setMahallas([]));
    } else if (!isSuperAdmin) {
      monitoringApi
        .getMahallasDropdown()
        .then((data) => setMahallas(data as any))
        .catch(() => setMahallas([]));
    } else {
      setMahallas([]);
    }
  }, [isSuperAdmin, selectedDistrictId, user?.districtId]);

  // JSHSHIR bo'yicha tezkor tekshirish (Duplicate check va avto to'ldirish)
  const handlePinflChange = async (val: string) => {
    // Faqat raqamlar va maksimal 14 ta belgi
    const clean = val.replace(/\D/g, '').slice(0, 14);
    setPinfl(clean);
    setPinflWarning(null);

    // Agar 7 ta raqam bo'lsa va tug'ilgan sana hali kiritilmagan bo'lsa, avtomatik to'ldirish
    if (clean.length >= 7) {
      const extractedDate = extractBirthDateFromPinfl(clean);
      if (extractedDate) {
        if (!birthDate) {
          setBirthDate(extractedDate);
        }
        const ageCheck = isValidYouthAge(extractedDate);
        if (!ageCheck.valid) {
          setPinflWarning(ageCheck.message || 'Yosh chegarasi notoʻgʻri');
        }
      }
    }

    if (clean.length === 14) {
      // Dastlabki format tekshiruvi
      const pinflValidation = isValidPinfl(clean, birthDate || undefined);
      if (!pinflValidation.valid) {
        setPinflWarning(pinflValidation.message || 'JSHSHIR formati noto\'g\'ri');
        return;
      }

      setPinflChecking(true);
      try {
        const found = await monitoringApi.checkPinfl(clean);
        if (found) {
          setPinflWarning(
            `Diqqat: Ushbu JSHSHIR bo'yicha fuqaro bazada allaqachon mavjud (${found.fullName}, ${found.mahalla?.name || 'MFY'}). Yangi so'rovnoma yuborilsa, u sifat nazorati (Data Reviewer) navbatiga ziddiyat sifatida yo'naltiriladi!`,
          );
          if (!fullName) setFullName(found.fullName);
          if (!address) setAddress(found.address);
          if (!education) setEducation(found.education);
          if (!phone && found.phone) setPhone(found.phone);
        }
      } catch {
        // ignore
      } finally {
        setPinflChecking(false);
      }
    }
  };

  const toggleDirection = (dir: UnemployedDirection) => {
    if (unemployedDirections.includes(dir)) {
      setUnemployedDirections(unemployedDirections.filter((d) => d !== dir));
    } else {
      setUnemployedDirections([...unemployedDirections, dir]);
    }
  };

  const validateStep1 = () => {
    if (isSuperAdmin && !selectedDistrictId) {
      setError('Iltimos, tumanni tanlang');
      return false;
    }
    if (!mahallaId) {
      setError('Iltimos, mahallani tanlang');
      return false;
    }
    if (!surveyDate) {
      setError('So\'rovnoma sanasi kiritilishi shart');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!fullName.trim()) {
      setError('Fuqaroning F.I.Sh. kiritilishi majburiy');
      return false;
    }
    if (!isValidFullName(fullName)) {
      setError('F.I.Sh. noto\'g\'ri formatda. Kamida 2 ta so\'z (Ism va Familiya)dan iborat bo\'lishi va raqam qatnashmasligi kerak');
      return false;
    }
    if (!birthDate) {
      setError('Tug\'ilgan sana majburiy');
      return false;
    }
    const ageValidation = isValidYouthAge(birthDate);
    if (!ageValidation.valid) {
      setError(ageValidation.message || 'Yosh chegarasi noto\'g\'ri');
      return false;
    }
    const pinflValidation = isValidPinfl(pinfl, birthDate);
    if (!pinflValidation.valid) {
      setError(pinflValidation.message || 'JSHSHIR noto\'g\'ri');
      return false;
    }
    if (!address.trim() || !hasLetters(address)) {
      setError('Yashash manzili kiritilishi shart va faqat raqamlardan iborat bo\'lishi mumkin emas');
      return false;
    }
    if (!education.trim() || !hasLetters(education)) {
      setError('Ta\'lim muassasasi kiritilishi shart va faqat raqam bo\'lishi mumkin emas (masalan: 12-maktab, SamDU)');
      return false;
    }
    if (phone && !isValidUzPhone(phone)) {
      setError('Fuqaroning telefon raqami noto\'g\'ri formatda. Format: +998 (XX) XXX-XX-XX');
      return false;
    }
    if (parentPhone && !isValidUzPhone(parentPhone)) {
      setError('Ota-onasining telefon raqami noto\'g\'ri formatda. Format: +998 (XX) XXX-XX-XX');
      return false;
    }
    if (specialty.trim() && !hasLetters(specialty)) {
      setError('Mutaxassislik nomi faqat raqamlardan iborat bo\'lishi mumkin emas');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    if (mainCategory === 'OFFICIALLY_EMPLOYED') {
      if (!officialWorkplace.trim() || !hasLetters(officialWorkplace)) {
        setError('2.1. Rasmiy band holatida ish joyi va lavozimi to\'liq kiritilishi shart (faqat raqam bo\'lishi mumkin emas)');
        return;
      }
    }
    if (mainCategory === 'SELF_EMPLOYED') {
      if (!selfEmployedActivity.trim() || !hasLetters(selfEmployedActivity)) {
        setError('2.2. Oʻzini band qilgan toifasida faoliyat turi to\'liq kiritilishi shart');
        return;
      }
    }
    if (mainCategory === 'UNOFFICIALLY_EMPLOYED') {
      if (!unofficialActivityType.trim() || !hasLetters(unofficialActivityType)) {
        setError('2.3. Norasmiy band holatida faoliyat turi to\'liq kiritilishi shart (faqat raqam bo\'lishi mumkin emas)');
        return;
      }
    }
    if (mainCategory === 'MIGRANT') {
      if (!migrantCountry.trim() || !hasLetters(migrantCountry)) {
        setError('2.4. Migrant toifasida qaysi davlatda ekanligi kiritilishi yoki tanlanishi shart');
        return;
      }
    }
    if (mainCategory === 'UNEMPLOYED' && unemployedDirections.length === 0) {
      setError('2.5. Ishsiz holatida kamida bitta talab qilinadigan yo\'nalish tanlanishi shart');
      return;
    }
    if (mainCategory === 'OTHER') {
      if (!otherReasonNote.trim() || !hasLetters(otherReasonNote)) {
        setError('2.7. Boshqa holati tanlanganda mazmunli izoh yozilishi shart');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: any = {
        mahallaId,
        surveyMethod,
        surveyDate,
        fullName: fullName.trim(),
        birthDate,
        pinfl: pinfl.trim(),
        address: address.trim(),
        education: education.trim(),
        phone: phone.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        specialty: specialty.trim() || undefined,
        mainCategory,
        officialWorkplace:
          mainCategory === 'OFFICIALLY_EMPLOYED' ? officialWorkplace.trim() : undefined,
        selfEmployedActivity:
          mainCategory === 'SELF_EMPLOYED' ? selfEmployedActivity.trim() : undefined,
        selfEmployedRegistered:
          mainCategory === 'SELF_EMPLOYED' ? selfEmployedRegistered : undefined,
        unofficialActivityType:
          mainCategory === 'UNOFFICIALLY_EMPLOYED' ? unofficialActivityType.trim() : undefined,
        migrantCountry:
          mainCategory === 'MIGRANT' ? migrantCountry.trim() : undefined,
        migrantDuration:
          mainCategory === 'MIGRANT' ? (migrantDuration.trim() || undefined) : undefined,
        noWishReason: mainCategory === 'NO_WISH_TO_WORK' ? noWishReason : undefined,
        unemployedDirections:
          mainCategory === 'UNEMPLOYED' ? unemployedDirections : undefined,
        unemployedAdditionalNote:
          mainCategory === 'UNEMPLOYED' ? unemployedAdditionalNote.trim() : undefined,
        otherReasonNote: mainCategory === 'OTHER' ? otherReasonNote.trim() : undefined,
        citizenSigned,
        operatorSigned,
      };

      const res = await monitoringApi.createSurvey(payload);
      setResult(res);
      localStorage.removeItem('operator_survey_draft');
      if (res.isConflict) {
        toast.warning(
          res.message || 'Soʻrovnoma tekshiruv navbatiga yoʻnaltirildi (Ziddiyat aniqlandi)',
          'Diqqat',
        );
      } else {
        toast.success(
          res.message || 'Soʻrovnoma muvaffaqiyatli qabul qilindi!',
          'Muvaffaqiyatli',
        );
      }
    } catch (err: any) {
      const msg = err.message || 'Anketani yuborishda xatolik yuz berdi';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('operator_survey_draft');
    setResult(null);
    setStep(1);
    if (!isMahallaOperator) {
      setMahallaId('');
    }
    if (isSuperAdmin) {
      setSelectedDistrictId('');
    }
    setFullName('');
    setBirthDate('');
    setPinfl('');
    setAddress('');
    setEducation('');
    setPhone('');
    setParentPhone('');
    setSpecialty('');
    setOfficialWorkplace('');
    setUnofficialActivityType('');
    setUnemployedDirections(['PERMANENT_JOB']);
    setUnemployedAdditionalNote('');
    setOtherReasonNote('');
    setPinflWarning(null);
    setError(null);
  };

  return (
    <DashboardLayout
      title="Raqamli Soʻrovnoma Kiritish"
      breadcrumbs={['Sahifalar', 'Soʻrovnomalar', 'Yangi soʻrovnoma']}
    >
      <div className="max-w-4xl mx-auto py-2">
        {/* Natija oynasi (Muvaffaqiyatli saqlanganda yoki Ziddiyat aniqlanganda) */}
        {result && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                result.isConflict ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {result.isConflict ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                {result.isConflict
                  ? 'Soʻrovnoma Tekshiruv Navbatiga Yuborildi'
                  : 'Soʻrovnoma Muvaffaqiyatli Qabul Qilindi'}
              </h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                {result.message}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-md mx-auto text-left text-xs space-y-1.5">
              <p>
                <span className="font-semibold text-slate-500">Fuqaro:</span>{' '}
                <span className="font-bold text-slate-900">{fullName}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">JSHSHIR:</span>{' '}
                <span className="font-bold text-slate-900">{pinfl}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Kategoriya:</span>{' '}
                <span className="font-bold text-[#163D5C]">{mainCategory}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="h-12 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white font-bold text-sm transition shadow-xs flex items-center justify-center cursor-pointer"
              >
                Yana yangi anketa toʻldirish
              </button>
              <button
                type="button"
                onClick={() => navigate('/surveys')}
                className="h-12 rounded-xl border-2 border-[#163D5C] text-[#163D5C] font-bold text-sm bg-white hover:bg-slate-50 transition flex items-center justify-center cursor-pointer"
              >
                Anketalar roʻyxatiga oʻtish
              </button>
            </div>
          </div>
        )}

        {!result && (fullName || pinfl || address || phone) && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-sky-50/90 border border-sky-200/80 rounded-2xl text-xs text-sky-900 mb-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>
                <b>Avto-saqlash faol:</b> Soʻrovnoma qoralama sifatida brauzerda saqlab qolinmoqda. Sahifa yangilansa (refresh) maʼlumotlar yoʻqolmaydi.
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline ml-3 cursor-pointer flex-shrink-0"
            >
              Formani tozalash
            </button>
          </div>
        )}

        {!result && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm">
            {/* Top Segmented Capsule Bar (Image 2 style) */}
            <div className="bg-[#f1f3f6] p-1.5 rounded-full flex items-center mb-8 max-w-2xl mx-auto shadow-inner">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 py-2.5 px-3 sm:px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                  step === 1
                    ? 'bg-white text-[#163D5C] font-bold shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>1. Hudud & Metod</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    if (validateStep1()) setStep(2);
                  } else {
                    setStep(2);
                  }
                }}
                className={`flex-1 py-2.5 px-3 sm:px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                  step === 2
                    ? 'bg-white text-[#163D5C] font-bold shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>2. Fuqaro profili</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    if (validateStep1() && validateStep2()) setStep(3);
                  } else if (step === 2) {
                    if (validateStep2()) setStep(3);
                  } else {
                    setStep(3);
                  }
                }}
                className={`flex-1 py-2.5 px-3 sm:px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                  step === 3
                    ? 'bg-white text-[#163D5C] font-bold shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>3. Bandlik holati</span>
              </button>
            </div>

            {/* Xatolik xabari */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ======================================================== */}
              {/* 1-QADAM: HUDUD VA O'RGANISH METODI */}
              {/* ======================================================== */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {/* Tuman (shahar) */}
                    {isSuperAdmin ? (
                      <div>
                        <CustomSelect
                          label="Tuman (shahar)"
                          required
                          placeholder="Tumanni tanlang..."
                          value={selectedDistrictId}
                          onChange={(val) => {
                            setSelectedDistrictId(val);
                            setMahallaId('');
                          }}
                          icon={<MapPin className="w-4 h-4 text-[#163D5C]" />}
                          options={districts.map((d) => ({
                            value: d.id,
                            label: d.name,
                          }))}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                          Tuman (shahar)
                        </label>
                        <div className="h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-4 h-4 text-[#163D5C]" />
                            <span>{user?.districtName || currentDistrictName || 'Tuman'}</span>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-600">
                            {isDistrictAdmin ? 'Biriktirilgan tuman' : 'Avtomatik'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mahalla tanlagich */}
                    {isMahallaOperator && user?.mahallaId ? (
                      <div>
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                          Mahalla nomi
                        </label>
                        <div className="h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-[#163D5C]" />
                            <span>
                              {user?.mahallaName
                                ? `${user.mahallaName} MFY`
                                : mahallas.find((m) => m.id === mahallaId)?.name
                                  ? `${mahallas.find((m) => m.id === mahallaId)?.name} MFY`
                                  : 'Biriktirilgan mahalla'}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Avtomatik
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <CustomSelect
                          label="Mahalla nomi"
                          required
                          disabled={isSuperAdmin && !selectedDistrictId}
                          placeholder={
                            isSuperAdmin && !selectedDistrictId
                              ? 'Avval tumanni tanlang'
                              : 'Mahallani tanlang...'
                          }
                          value={mahallaId}
                          onChange={(val) => setMahallaId(val)}
                          icon={<Building2 className="w-4 h-4 text-[#163D5C]" />}
                          options={mahallas.map((m) => ({
                            value: m.id,
                            label: `${m.name} MFY`,
                          }))}
                        />
                      </div>
                    )}
                  </div>

                  {/* O'rganish shakli */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                      Oʻrganish shakli <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {[
                        {
                          id: 'HOME_VISIT',
                          title: 'Uyma-uy',
                          desc: 'Fuqaroning xonadoniga borib oʻrganish',
                          icon: <Home className="w-4 h-4" />,
                        },
                        {
                          id: 'PHONE',
                          title: 'Telefon',
                          desc: 'Qoʻngʻiroq orqali suhbat oʻtkazish',
                          icon: <Phone className="w-4 h-4" />,
                        },
                        {
                          id: 'IN_PERSON',
                          title: 'Qabulda',
                          desc: 'Fuqaro qabulga kelgan holatda',
                          icon: <UserCheck className="w-4 h-4" />,
                        },
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSurveyMethod(item.id as SurveyMethod)}
                          className={`p-4 rounded-2xl border transition duration-150 cursor-pointer flex items-start space-x-3.5 ${
                            surveyMethod === item.id
                              ? 'border-[#163D5C] bg-[#163D5C]/5 ring-1 ring-[#163D5C] shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              surveyMethod === item.id
                                ? 'bg-[#163D5C] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-900">
                              {item.title}
                            </span>
                            <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* So'rovnoma sanasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <Input
                        label="Soʻrovnoma oʻtkazilgan sana"
                        type="date"
                        required
                        value={surveyDate}
                        onChange={(e) => setSurveyDate(e.target.value)}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  {/* Bottom Navigation Buttons (Image 2 style) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 mt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => navigate('/surveys')}
                      className="h-12 rounded-xl border-2 border-[#163D5C] text-[#163D5C] font-bold text-sm bg-white hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Orqaga (Jurnal)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => validateStep1() && setStep(2)}
                      className="h-12 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Keyingisi: Fuqaro maʻlumotlari</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 2-QADAM: FUQARONING SHAXSIY MA'LUMOTLARI */}
              {/* ======================================================== */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* JSHSHIR ogohlantirishi */}
                  {pinflWarning && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{pinflWarning}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {/* F.I.Sh. */}
                    <div>
                      <Input
                        label="1. F.I.Sh."
                        required
                        placeholder="Familiyasi Ismi Otasining ismi"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        icon={<User className="w-4 h-4" />}
                      />
                    </div>

                    {/* Tug'ilgan sana */}
                    <div>
                      <Input
                        label="2. Tugʻilgan sanasi (18 - 60 yosh)"
                        type="date"
                        required
                        max={maxBirthDate}
                        min={minBirthDate}
                        value={birthDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBirthDate(val);
                          if (val) {
                            const check = isValidYouthAge(val);
                            if (!check.valid) {
                              setError(check.message || null);
                            } else {
                              setError(null);
                            }
                          }
                        }}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                      {citizenAge !== null && (
                        <div className="mt-1.5">
                          {citizenAge < 18 ? (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                              <span>
                                <b>Yosh chegarasi:</b> Fuqaroning yoshi {citizenAge} da (voyaga yetmagan). Bandlik monitoringiga faqat <b>18 yoshga toʻlgan</b> fuqarolar kiritiladi!
                              </span>
                            </div>
                          ) : citizenAge > 60 ? (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                              <span>
                                <b>Diqqat:</b> Fuqaroning yoshi {citizenAge} da. Bandlik monitoringi 18 dan 60 yoshgacha boʻlgan fuqarolar uchun oʻtkaziladi.
                              </span>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center space-x-2">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                              <span>
                                Fuqaro yoshi: <b>{citizenAge} yoshda</b> (18-60 yosh toifasiga toʻliq mos).
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* JSHSHIR */}
                    <div>
                      <Input
                        label="3. JSHSHIR raqami"
                        required
                        maxLength={14}
                        placeholder="14 ta raqam (masalan: 5021201...)"
                        value={pinfl}
                        onChange={(e) => handlePinflChange(e.target.value)}
                        icon={<Hash className="w-4 h-4" />}
                        helperText={pinflChecking ? 'Tekshirilmoqda...' : 'Tuzilishi: [1-raqam (jins: 3-6)][Kun: 2][Oy: 2][Yil: 2][7 ta raqam]'}
                      />
                      {birthDate && (
                        <div className="mt-1.5 p-2 rounded-xl bg-sky-50 border border-sky-100 text-[11px] text-sky-800 flex items-center justify-between">
                          <span>
                            💡 <b>{birthDate}</b> sanasi uchun JSHSHIR boshi: <b>{birthDate.startsWith('20') ? '5' : '3'}{birthDate.split('-')[2]}{birthDate.split('-')[1]}{birthDate.split('-')[0].slice(2)}...</b>
                          </span>
                          {(!pinfl || pinfl.length < 7) && (
                            <button
                              type="button"
                              onClick={() => {
                                const prefix = `${birthDate.startsWith('20') ? '5' : '3'}${birthDate.split('-')[2]}${birthDate.split('-')[1]}${birthDate.split('-')[0].slice(2)}`;
                                handlePinflChange(prefix);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#163D5C] hover:bg-[#11314a] text-white font-semibold text-[10px] transition cursor-pointer shrink-0 ml-2"
                            >
                              Boshini qoʻyish
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Telefon raqami */}
                    <div>
                      <Input
                        label="4. Telefon raqami"
                        placeholder="+998 (90) 123-45-67"
                        value={phone}
                        onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                        icon={<Phone className="w-4 h-4" />}
                      />
                    </div>

                    {/* Ota-onasi telefoni */}
                    <div>
                      <Input
                        label="5. Otasi yoki onasining tel raqami"
                        placeholder="+998 (91) 987-65-43"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(formatUzPhone(e.target.value))}
                        icon={<Phone className="w-4 h-4" />}
                      />
                    </div>

                    {/* Yashash manzili */}
                    <div>
                      <Input
                        label="6. Yashash manzili"
                        required
                        placeholder="Koʻcha nomi, uy va xonadon raqami"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        icon={<MapPin className="w-4 h-4" />}
                      />
                    </div>

                    {/* Qaysi ta'lim muassasasini tugatgan */}
                    <div>
                      <Input
                        label="7. Qaysi taʻlim muassasasini tugatgan"
                        required
                        placeholder="Maktab, Litsey, Kollej, Texnikum yoki OTM"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        icon={<GraduationCap className="w-4 h-4" />}
                      />
                    </div>

                    {/* Mutaxassisligi */}
                    <div>
                      <Input
                        label="8. Mutaxassisligi"
                        helperText="(Ixtiyoriy)"
                        placeholder="Dasturchi, Tikuvchi, Iqtisodchi va h.k."
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        icon={<Briefcase className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  {/* Bottom Navigation Buttons (Image 2 style) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 mt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-12 rounded-xl border-2 border-[#163D5C] text-[#163D5C] font-bold text-sm bg-white hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Orqaga</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => validateStep2() && setStep(3)}
                      className="h-12 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Keyingisi: Bandlik holati</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 3-QADAM: BANDLIK HOLATI (2.1 - 2.5 QAT'IY BITTA KATEGORIYA) */}
              {/* ======================================================== */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      II. Bandlik Holati (2.1 – 2.5 Asosiy Toifa)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Faqat bitta asosiy kategoriya tanlanadi va shunga mos qoʻshimcha maydonlar ochiladi
                    </p>
                  </div>

                  {/* 5 ta Asosiy Tanlov Kartasi */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {/* 2.1. Rasmiy band */}
                    <div
                      onClick={() => setMainCategory('OFFICIALLY_EMPLOYED')}
                      className={`p-4 rounded-2xl border transition duration-150 cursor-pointer ${
                        mainCategory === 'OFFICIALLY_EMPLOYED'
                          ? 'border-[#163D5C] bg-[#163D5C]/5 ring-1 ring-[#163D5C] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            mainCategory === 'OFFICIALLY_EMPLOYED'
                              ? 'border-[#163D5C] bg-[#163D5C] text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {mainCategory === 'OFFICIALLY_EMPLOYED' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            2.1. Rasmiy band
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Qonuniy mehnat shartnomasiga ega boʻlgan fuqarolar
                          </span>
                        </div>
                      </div>

                      {/* 2.1 Shartli Maydon: Ish joyi va lavozimi */}
                      {mainCategory === 'OFFICIALLY_EMPLOYED' && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200">
                          <Input
                            label="Ish joyi va lavozimi"
                            required
                            placeholder="Korxona/tashkilot nomi va lavozimi"
                            value={officialWorkplace}
                            onChange={(e) => setOfficialWorkplace(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* 2.2. Oʻzini oʻzi band qilgan */}
                    <div
                      onClick={() => setMainCategory('SELF_EMPLOYED')}
                      className={`p-4 rounded-2xl border transition duration-150 cursor-pointer ${
                        mainCategory === 'SELF_EMPLOYED'
                          ? 'border-[#0284C7] bg-[#0284C7]/5 ring-1 ring-[#0284C7] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            mainCategory === 'SELF_EMPLOYED'
                              ? 'border-[#0284C7] bg-[#0284C7] text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {mainCategory === 'SELF_EMPLOYED' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            2.2. Oʻzini band qilgan
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Yakka tartibdagi mustaqil faoliyat (hunarmand, taksi, repetitor, usta, frilanser va h.k.)
                          </span>
                        </div>
                      </div>

                      {/* 2.2 Shartli Maydon: Faoliyat turi va Soliq ro'yxati */}
                      {mainCategory === 'SELF_EMPLOYED' && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-3">
                          <Input
                            label="Faoliyat yoʻnalishi"
                            required
                            placeholder="Masalan: Hunarmandchilik, Repetitorlik, IT/Frilans, Yoʻlovchi tashish (taksi)"
                            value={selfEmployedActivity}
                            onChange={(e) => setSelfEmployedActivity(e.target.value)}
                          />

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelfEmployedRegistered(!selfEmployedRegistered);
                            }}
                            className="flex items-center space-x-2.5 pt-1 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={selfEmployedRegistered}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7]"
                            />
                            <span className="text-xs text-slate-700 font-medium">
                              Soliq organlarida (soliq.uz / my.soliq) oʻzini band qilgan sifatida roʻyxatdan oʻtgan
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2.3. Norasmiy band */}
                    <div
                      onClick={() => setMainCategory('UNOFFICIALLY_EMPLOYED')}
                      className={`p-4 rounded-2xl border transition duration-150 cursor-pointer ${
                        mainCategory === 'UNOFFICIALLY_EMPLOYED'
                          ? 'border-[#163D5C] bg-[#163D5C]/5 ring-1 ring-[#163D5C] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            mainCategory === 'UNOFFICIALLY_EMPLOYED'
                              ? 'border-[#163D5C] bg-[#163D5C] text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {mainCategory === 'UNOFFICIALLY_EMPLOYED' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            2.3. Norasmiy band
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Daromadga ega, lekin rasmiylashtirilmagan faoliyat turlari (mavsumiy mardikorlik va h.k.)
                          </span>
                        </div>
                      </div>

                      {/* 2.3 Shartli Maydon: Faoliyat turi */}
                      {mainCategory === 'UNOFFICIALLY_EMPLOYED' && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200">
                          <Input
                            label="Faoliyat turi"
                            required
                            placeholder="Masalan: shaxsiy ustachilik, kunlik mardikorlik, mavsumiy ishlar"
                            value={unofficialActivityType}
                            onChange={(e) => setUnofficialActivityType(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* 2.4. Migrant */}
                    <div
                      onClick={() => setMainCategory('MIGRANT')}
                      className={`p-4 rounded-2xl border transition duration-150 cursor-pointer ${
                        mainCategory === 'MIGRANT'
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/5 ring-1 ring-[#8B5CF6] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            mainCategory === 'MIGRANT'
                              ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {mainCategory === 'MIGRANT' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            2.4. Migrant
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Hozirda chet elda (xorijiy davlatda) vaqtinchalik yoki doimiy ishlayotgan fuqarolar
                          </span>
                        </div>
                      </div>

                      {/* 2.4 Shartli Maydon: Davlat va Ketgan muddati */}
                      {mainCategory === 'MIGRANT' && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Xorijiy davlatni tanlang yoki yozing <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {['Rossiya', 'Qozogʻiston', 'Turkiya', 'Janubiy Koreya', 'BAA', 'Buyuk Britaniya'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMigrantCountry(c);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                    migrantCountry === c
                                      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                            <Input
                              placeholder="Boshqa davlat nomi..."
                              value={migrantCountry}
                              onChange={(e) => setMigrantCountry(e.target.value)}
                            />
                          </div>

                          <Input
                            label="Ketgan muddati / Taxminiy qaytish rejasi (ixtiyoriy)"
                            placeholder="Masalan: Mavsumiy (6 oy), Uzoq muddatli, 2026-yil oxirigacha"
                            value={migrantDuration}
                            onChange={(e) => setMigrantDuration(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* 2.5. Ishsiz yosh */}
                    <div
                      onClick={() => setMainCategory('UNEMPLOYED')}
                      className={`p-4 rounded-2xl border transition duration-150 cursor-pointer ${
                        mainCategory === 'UNEMPLOYED'
                          ? 'border-[#163D5C] bg-[#163D5C]/5 ring-1 ring-[#163D5C] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            mainCategory === 'UNEMPLOYED'
                              ? 'border-[#163D5C] bg-[#163D5C] text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {mainCategory === 'UNEMPLOYED' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            2.5. Ishsiz yosh
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Ishlash istagi bor, amaliy yordam va bandlik choralari talab etiladi
                          </span>
                        </div>
                      </div>

                      {/* 2.5 Shartli Maydon: Yo'nalishlar (Multiple Checkbox) */}
                      {mainCategory === 'UNEMPLOYED' && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-3">
                          <p className="text-xs font-bold text-slate-700">
                            Talab qilinadigan yoʻnalishlarni belgilang: <span className="text-red-500">*</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[
                              { id: 'PERMANENT_JOB', label: 'Doimiy ishga joylashtirish' },
                              { id: 'SUBSIDY', label: 'Subsidiya ajratish' },
                              { id: 'VOCATIONAL_TRAINING', label: 'Kasb-hunarga oʻqitish' },
                              { id: 'LOAN_BUSINESS', label: 'Kredit orqali tadbirkorlik' },
                              { id: 'ADDITIONAL', label: 'Qoʻshimcha yoʻnalish' },
                            ].map((dir) => {
                              const isChecked = unemployedDirections.includes(
                                dir.id as UnemployedDirection,
                              );
                              return (
                                <div
                                  key={dir.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDirection(dir.id as UnemployedDirection);
                                  }}
                                  className={`p-2.5 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition ${
                                    isChecked
                                      ? 'border-[#163D5C] bg-[#163D5C]/10 text-[#163D5C] font-bold'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-[#163D5C] flex-shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                  )}
                                  <span className="text-xs">{dir.label}</span>
                                </div>
                              );
                            })}
                          </div>

                          {unemployedDirections.includes('ADDITIONAL') && (
                            <div className="pt-2">
                              <Input
                                label="Qoʻshimcha yoʻnalish izohi"
                                placeholder="Aniq qanday yordam yoki yoʻnalish kerakligi..."
                                value={unemployedAdditionalNote}
                                onChange={(e) => setUnemployedAdditionalNote(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2.6. Ishlash istagi yo'q */}
                    <div
                      onClick={() => setMainCategory('NO_WISH_TO_WORK')}
                      className={`p-4 rounded-2xl border transition duration-150 cursor-pointer ${
                        mainCategory === 'NO_WISH_TO_WORK'
                          ? 'border-[#163D5C] bg-[#163D5C]/5 ring-1 ring-[#163D5C] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            mainCategory === 'NO_WISH_TO_WORK'
                              ? 'border-[#163D5C] bg-[#163D5C] text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {mainCategory === 'NO_WISH_TO_WORK' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            2.6. Ishlash istagi yoʻq
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Hozirda mehnat bozoriga chiqishni istamaydigan fuqarolar
                          </span>
                        </div>
                      </div>

                      {/* 2.6 Shartli Maydon: Sabablar tanlovi */}
                      {mainCategory === 'NO_WISH_TO_WORK' && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-2">
                          <p className="text-xs font-bold text-slate-700">
                            Sababini tanlang: <span className="text-red-500">*</span>
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              { id: 'CHILD_CARE', label: 'Bola tarbiyasida' },
                              { id: 'HOUSEWIFE', label: 'Uy bekasi' },
                              { id: 'WEALTHY_FAMILY', label: 'Oʻziga toʻq oila' },
                              { id: 'APPLICANT', label: 'Abituriyent' },
                            ].map((reason) => (
                              <button
                                key={reason.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoWishReason(reason.id as NoWishReason);
                                }}
                                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                                  noWishReason === reason.id
                                    ? 'border-[#163D5C] bg-[#163D5C] text-white shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {reason.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2.7. Boshqa */}
                    <div
                      onClick={() => setMainCategory('OTHER')}
                      className={`p-4 rounded-2xl border transition duration-150 cursor-pointer ${
                        mainCategory === 'OTHER'
                          ? 'border-[#163D5C] bg-[#163D5C]/5 ring-1 ring-[#163D5C] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            mainCategory === 'OTHER'
                              ? 'border-[#163D5C] bg-[#163D5C] text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {mainCategory === 'OTHER' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            2.7. Boshqa
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Yuqoridagi toifalarga kirmaydigan alohida holatlar
                          </span>
                        </div>
                      </div>

                      {/* 2.5 Shartli Maydon: Izoh */}
                      {mainCategory === 'OTHER' && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200">
                          <Textarea
                            label="Sababni batafsil yozing"
                            required
                            placeholder="Salomatligi tufayli nogironlik, chet elga ketgan, harbiy xizmatda va h.k."
                            value={otherReasonNote}
                            onChange={(e) => setOtherReasonNote(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Imzolar va Audit tasdig'i */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={citizenSigned}
                        onChange={(e) => setCitizenSigned(e.target.checked)}
                        className="rounded-md text-[#163D5C] focus:ring-[#163D5C] w-4 h-4"
                      />
                      <span>Fuqaro roziligi / imzosi olindi</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={operatorSigned}
                        onChange={(e) => setOperatorSigned(e.target.checked)}
                        className="rounded-md text-[#163D5C] focus:ring-[#163D5C] w-4 h-4"
                      />
                      <span>Yetakchi tasdigʻi / imzosi</span>
                    </label>
                  </div>

                  {/* Bottom Navigation Buttons (Image 2 style) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 mt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-12 rounded-xl border-2 border-[#163D5C] text-[#163D5C] font-bold text-sm bg-white hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Orqaga</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="h-12 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Yuborilmoqda...' : 'Tasdiqlash & Bazaga Saqlash'}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
