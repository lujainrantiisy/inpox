"use client"

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Composer from '../components/Composer'
import LoginForm from '../components/LoginForm'

type Conversation = {
  id: string
  contact: string
  channel: string
  status: string
  unread: number
  last_message: string | null
  updated_at: string
  needs_human: boolean
}

type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'agent'
  body: string | null
  image_url: string | null
  created_at: string
}

export default function Page() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'in' | 'out'>('checking')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  async function loadConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) {
      setLoadError(error.message)
    } else {
      setLoadError(null)
      setConversations((data as Conversation[]) || [])
    }
    setLoading(false)
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])
  }

  async function signOut() {
    await supabase.auth.signOut()
    setConversations([])
    setMessages([])
    setActiveId(null)
    setLoading(true)
  }

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthStatus(data.session ? 'in' : 'out')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthStatus(session ? 'in' : 'out')
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Realtime subscriptions
  useEffect(() => {
    if (authStatus !== 'in') return
    loadConversations()
    const channel = supabase
      .channel('inbox-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        loadConversations()
        const id = activeIdRef.current
        const changedConversationId =
          (payload.new as Partial<Message> | null)?.conversation_id ??
          (payload.old as Partial<Message> | null)?.conversation_id
        if (id && (!changedConversationId || changedConversationId === id)) {
          loadMessages(id)
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [authStatus])

  useEffect(() => {
    activeIdRef.current = activeId
    if (activeId) loadMessages(activeId)
    else setMessages([])
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function seedDemo() {
    const customerName = window.prompt("Enter customer name:", "زائر الموقع") || "زائر الموقع"

    const { data } = await supabase
      .from('conversations')
      .insert({ contact: customerName, channel: 'web', last_message: 'محادثة جديدة' })
      .select()
      .single()

    if (data) {
      await loadConversations()
      setActiveId((data as Conversation).id)
    }
  }

  // Helper formatting for timestamps
  function formatTime(dateStr?: string) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  }

  // Channel badge icon helper
  function renderChannelBadge(channelName: string) {
    const ch = channelName.toLowerCase()
    return (
      <span className="channel-pill">
        {ch === 'instagram' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        )}
        {ch === 'whatsapp' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        )}
        {ch === 'facebook' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        )}
        {(ch === 'web' || !['instagram', 'whatsapp', 'facebook'].includes(ch)) && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        )}
        {channelName.toUpperCase()}
      </span>
    )
  }

  if (authStatus === 'checking') {
    return (
      <div className="empty" style={{ height: '100vh' }}>
        <div className="empty-orb">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </div>
        <span>جاري التحميل...</span>
      </div>
    )
  }

  if (authStatus === 'out') {
    return <LoginForm />
  }

  const active = conversations.find((c) => c.id === activeId) || null

  return (
    <div className={`app ${activeId ? 'mobile-chat-open' : ''}`}>
      {/* Sidebar - Positioned on the Right in RTL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <span className="glowing-dot" />
            <h1>صندوق الفريق</h1>
          </div>
          <div className="sidebar-actions">
            <button className="btn" style={{ flex: 1 }} onClick={seedDemo}>
              + محادثة تجريبية
            </button>
            <button className="btn secondary" onClick={signOut} aria-label="تسجيل الخروج">
              تسجيل الخروج
            </button>
          </div>
        </div>

        <div className="convo-list">
          {loading && (
            <div className="empty">
              <span>جاري تحميل المحادثات...</span>
            </div>
          )}

          {!loading && loadError && (
            <div className="empty" style={{ color: '#EF4444' }}>
              تعذر تحميل المحادثات.
              <button className="btn secondary" style={{ marginTop: 8 }} onClick={loadConversations}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && !loadError && conversations.length === 0 && (
            <div className="empty">
              <div className="empty-orb">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <span>لا توجد محادثات بعد</span>
            </div>
          )}

          {conversations.map((c) => (
            <div
              key={c.id}
              className={'convo' + (c.id === activeId ? ' active' : '')}
              onClick={() => setActiveId(c.id)}
            >
              <div className="convo-avatar">
                {c.contact ? c.contact.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="convo-info">
                <div className="top">
                  <span className="name">{c.contact}</span>
                  <span className="convo-time">{formatTime(c.updated_at)}</span>
                </div>
                <div className="convo-bottom">
                  <span className="preview">{c.last_message || 'لا توجد رسائل بعد'}</span>
                  {renderChannelBadge(c.channel)}
                  {c.unread > 0 && <span className="unread-dot" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Thread */}
      <main className="thread">
        {!active && (
          <div className="empty">
            <div className="empty-orb">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span>اختر محادثة للبدء</span>
          </div>
        )}

        {active && (
          <>
            <div className="thread-header">
              <div className="header-user-info">
                {/* Mobile Back Button */}
                <button
                  className="mobile-back-btn"
                  onClick={() => setActiveId(null)}
                  aria-label="العودة للقائمة"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="header-user-name">{active.contact}</span>
                {renderChannelBadge(active.channel)}

                {active.needs_human && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#F87171',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 999,
                      padding: '2px 8px',
                    }}
                  >
                    ⚠ يحتاج موظف
                  </span>
                )}
              </div>

              <div className="agent-status">
                <span className="pulse-dot" />
                <span>الوكيل نشط</span>
              </div>
            </div>

            <div className="messages">
              {messages.map((m) => (
                <div key={m.id} className={'row ' + m.role}>
                  {m.role === 'agent' && (
                    <div className="agent-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span>AI Agent</span>
                    </div>
                  )}

                  <div className={'bubble ' + m.role}>
                    {m.body}
                    {m.image_url && <img src={m.image_url} alt="مرفق" />}
                  </div>

                  <span className="msg-time">{formatTime(m.created_at)}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <Composer conversationId={active.id} />
          </>
        )}
      </main>
    </div>
  )
}