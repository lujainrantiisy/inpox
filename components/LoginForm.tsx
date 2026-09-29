"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isValidEmail, normalizeEmail } from '../lib/emailValidation'

export default function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignup = mode === 'signup'

  function switchMode() {
    setMode(isSignup ? 'signin' : 'signup')
    setConfirmPassword('')
    setEmailError(null)
    setError(null)
    setInfo(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    const normalizedEmail = normalizeEmail(email)
    setEmail(normalizedEmail)
    setEmailError(null)

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('يرجى إدخال بريد إلكتروني صالح مثل name@example.com.')
      return
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور.')
      return
    }

    if (isSignup && !confirmPassword) {
      setError('يرجى تأكيد كلمة المرور.')
      return
    }

    if (isSignup && password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.')
      return
    }

    if (isSignup && password.length < 6) {
      setError('يجب أن تتكون كلمة المرور من 6 خانات على الأقل.')
      return
    }

    setLoading(true)
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password })
      setLoading(false)
      if (error) return setError(error.message)
      setConfirmPassword('')
      if (!data.session) {
        setInfo('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيده، ثم تسجيل الدخول.')
        setMode('signin')
      } else {
        setInfo('تم إنشاء الحساب وتسجيل الدخول بنجاح.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      setLoading(false)
      if (error) setError(error.message)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(100% 100% at 50% 0%, #0F172A 0%, #030712 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '20px',
        direction: 'rtl',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow Effects Background */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#38BDF8',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#F8FAFC',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            LUJAIN'S Inbox
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
            {isSignup ? 'أنشئ حسابك الجديد للبدء' : 'سجّل الدخول وإدارة محادثات فريقك'}
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#CBD5E1',
                marginBottom: '8px',
              }}
            >
              البريد الإلكتروني
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(null)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                color: '#F8FAFC',
                transition: 'all 0.2s ease',
                direction: 'ltr',
                textAlign: 'right',
              }}
            />
            {emailError && (
              <p style={{ color: '#F87171', fontSize: '12px', marginTop: '6px' }} role="alert">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#CBD5E1',
                marginBottom: '8px',
              }}
            >
              كلمة المرور
            </label>
            <input
              type="password"
              placeholder={isSignup ? '6 خانات على الأقل' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                color: '#F8FAFC',
                transition: 'all 0.2s ease',
                direction: 'ltr',
                textAlign: 'right',
              }}
            />
          </div>

          {isSignup && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#CBD5E1',
                  marginBottom: '8px',
                }}
              >
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                placeholder="أعد كتابة كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${confirmPassword && password !== confirmPassword ? '#EF4444' : 'rgba(255, 255, 255, 0.12)'}`,
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  color: '#F8FAFC',
                  transition: 'all 0.2s ease',
                  direction: 'ltr',
                  textAlign: 'right',
                }}
              />
              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: '#F87171', fontSize: '12px', marginTop: '6px' }}>
                  كلمتا المرور غير متطابقتين.
                </p>
              )}
            </div>
          )}

          {/* Success / Info Message */}
          {info && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34D399',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{info}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? 'rgba(56, 189, 248, 0.3)'
                : 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '6px',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'جاري التحميل...' : isSignup ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* Toggle Mode Button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button"
            onClick={switchMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#38BDF8',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
          >
            {isSignup ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'حساب جديد؟ أنشئ حسابك الآن'}
          </button>
        </div>
      </div>
    </main>
  )
}