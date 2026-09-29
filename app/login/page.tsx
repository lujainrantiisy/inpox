"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { isValidEmail, normalizeEmail } from "../../lib/emailValidation";

export default function LoginForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true); // الوضع الافتراضي إنشاء حساب
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // التحقق المباشر من مطابقة كلمة المرور
  const isPasswordMismatch =
    isSignUp && confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);

    if (!isValidEmail(normalizedEmail)) {
      setEmailError("يرجى إدخال بريد إلكتروني صالح مثل name@example.com.");
      return;
    }

    if (!password) {
      setError("يرجى إدخال كلمة المرور.");
      return;
    }

    if (isSignUp) {
      if (!confirmPassword) {
        setError("يرجى تأكيد كلمة المرور.");
        return;
      }

      if (password !== confirmPassword) {
        setError("كلمتا المرور غير متطابقتين");
        return;
      }

      if (password.length < 6) {
        setError("يجب أن تتكون كلمة المرور من 6 خانات على الأقل.");
        return;
      }
    }

    setLoading(true);
    if (isSignUp) {
      const { error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        setLoading(false);
        setError(authError.message);
        return;
      }
    } else {
      // طلب تسجيل الدخول
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        setLoading(false);
        setError(authError.message);
        return;
      }
    }

    router.refresh();
    router.replace("/");
  }

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-[#0B121E]/80 border border-cyan-500/20 backdrop-blur-md shadow-2xl text-right dir-rtl">
      {/* Icon & Title */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          LUJAIN'S InBox
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {isSignUp ? "أنشئ حسابك الجديد للبدء" : "سجل الدخول إلى حسابك"}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* البريد الإلكتروني */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-[#070D18] border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-left transition-colors"
            dir="ltr"
          />
          {emailError && (
            <p className="text-red-400 text-xs mt-1" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {/* كلمة المرور */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            كلمة المرور
          </label>
          <input
            type="password"
            placeholder="6 خانات على الأقل"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-[#070D18] border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-left transition-colors"
            dir="ltr"
          />
        </div>

        {/* حقل تأكيد كلمة المرور (يظهر فقط في حالة إنشاء حساب) */}
        {isSignUp && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              placeholder="أعد كتابة كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-2.5 rounded-lg bg-[#070D18] border text-white placeholder-gray-500 focus:outline-none text-left transition-colors ${
                isPasswordMismatch
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-800 focus:border-cyan-500"
              }`}
              dir="ltr"
            />
            {isPasswordMismatch && (
              <p className="text-red-400 text-xs mt-1">كلمتا المرور غير متطابقتين</p>
            )}
          </div>
        )}

        {/* زر الإرسال */}
        <button
          type="submit"
          disabled={loading || isPasswordMismatch}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all mt-2"
        >
          {loading
            ? "جاري المعالجة..."
            : isSignUp
            ? "إنشاء حساب جديد"
            : "تسجيل الدخول"}
        </button>

        {/* رسائل الخطأ */}
        {error && (
          <p className="text-red-400 text-xs text-center mt-2" role="alert">
            {error}
          </p>
        )}
      </form>

      {/* التبديل بين إنشاء حساب وتسجيل الدخول */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="text-xs text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-md hover:bg-cyan-500/10 transition-colors"
        >
          {isSignUp
            ? "لديك حساب بالفعل؟ تسجيل الدخول"
            : "ليس لديك حساب؟ إنشاء حساب جديد"}
        </button>
      </div>
    </div>
  );
}