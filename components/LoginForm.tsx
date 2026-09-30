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
      setEmailError('Please enter a valid email address like name@example.com.')
      return
    }

    if (!password) {
      setError('Please enter a password.')
      return
    }

    if (isSignup && !confirmPassword) {
      setError('Please confirm your password.')
      return
    }

    if (isSignup && password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password })
      setLoading(false)
      if (error) return setError(error.message)
      setConfirmPassword('')
      if (!data.session) {
        setInfo('the account has been created. Please check your email to confirm your account.')
        setMode('signin')
      } else {
        setInfo('the account has been created and you are now signed in.')
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

        {/* Header Section: ReplAI logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo-light.png"
            alt="ReplAI"
            style={{
              width: '210px',
              maxWidth: '75%',
              height: 'auto',
              display: 'block',
              margin: '0 auto 14px',
            }}
          />
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
            {isSignup ? 'Create your account to get started' : 'Where every message gets a smart reply'}
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
              Your Email
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
              Password
            </label>
            <input
              type="password"
              placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
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
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm Password"
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
                  The passwords do not match.
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
            {loading ? 'Loading...' : isSignup ? 'Create new account' : 'Login'}
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
            {isSignup ? 'Already have an account? Sign in' : 'New to our platform? Create your account now'}
          </button>
        </div>
      </div>
    </main>
  )
}