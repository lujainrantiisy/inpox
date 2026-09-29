"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            📥
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#0f172a',
            margin: '0 0 6px 0' 
          }}>
            Team Inbox
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Sign in to manage your support conversations
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#334155', 
              marginBottom: '6px' 
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#334155', 
              marginBottom: '6px' 
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          {/* Error Message Alert */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
              transition: 'background-color 0.2s ease'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}