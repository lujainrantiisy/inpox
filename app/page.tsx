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

  // Auth: signed in -> show the inbox, signed out -> show the login form (same URL).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthStatus(data.session ? 'in' : 'out')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthStatus(session ? 'in' : 'out')
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Load once (only after we know the user is signed in), then listen for realtime changes.
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

  // When the selected conversation changes, load its messages.
  useEffect(() => {
    activeIdRef.current = activeId
    if (activeId) loadMessages(activeId)
    else setMessages([])
  }, [activeId])

  // Auto-scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function seedDemo() {
    const { data } = await supabase
      .from('conversations')
      .insert({ contact: 'Website visitor', channel: 'web', last_message: 'New chat' })
      .select()
      .single()
    if (data) {
      await loadConversations()
      setActiveId((data as Conversation).id)
    }
  }

  // IMPORTANT: this early return must stay AFTER all hooks above.
  if (authStatus === 'checking') {
    return <div className="empty">Loading...</div>
  }
  if (authStatus === 'out') {
    return <LoginForm />
  }

  const active = conversations.find((c) => c.id === activeId) || null

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Team Inbox</h1>
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            gap: 8,
          }}
        >
          <button className="btn secondary" style={{ height: 36, padding: '0 12px' }} onClick={seedDemo}>
            + New demo chat
          </button>
          <button
            className="btn secondary"
            style={{ height: 36, padding: '0 12px', marginInlineStart: 'auto' }}
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
        <div className="convo-list">
          {loading && <div className="empty">Loading...</div>}
          {!loading && loadError && (
            <div className="empty" style={{ color: '#e5484d' }}>
              Couldn’t load conversations.<br />
              <button className="btn secondary" style={{ marginTop: 8 }} onClick={loadConversations}>
                Try again
              </button>
            </div>
          )}
          {!loading && !loadError && conversations.length === 0 && (
            <div className="empty">No conversations yet.<br />Click “+ New demo chat” to start.</div>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={'convo' + (c.id === activeId ? ' active' : '')}
              onClick={() => setActiveId(c.id)}
            >
              <div className="top">
                <span className="name">
                  {c.contact}
                  {c.needs_human && (
                    <span
                      title="بحاجة لمراجعة موظف"
                      style={{
                        marginInlineStart: 6,
                        display: 'inline-block',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        background: '#e5484d',
                        borderRadius: 999,
                        padding: '1px 7px',
                        verticalAlign: 'middle',
                      }}
                    >
                      ⚠ يحتاج موظف
                    </span>
                  )}
                </span>
                <span className="chan">{c.channel}</span>
              </div>
              <div className="preview">{c.last_message || 'No messages yet'}</div>
            </div>
          ))}
        </div>
      </aside>

      <main className="thread">
        {!active && <div className="empty">Pick a conversation to see the messages.</div>}
        {active && (
          <>
            <div className="thread-header">
              {active.contact} · <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{active.channel}</span>
              {active.needs_human && (
                <span
                  style={{
                    marginInlineStart: 10,
                    display: 'inline-block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#fff',
                    background: '#e5484d',
                    borderRadius: 999,
                    padding: '2px 10px',
                    verticalAlign: 'middle',
                  }}
                >
                  ⚠ تم تحويل المحادثة لموظف
                </span>
              )}
            </div>
            <div className="messages">
              {messages.map((m) => (
                <div key={m.id} className={'row ' + m.role}>
                  <div className={'bubble ' + m.role}>
                    <div className="who">{m.role === 'agent' ? 'Agent' : active.contact}</div>
                    {m.body}
                    {m.image_url && <img src={m.image_url} alt="attachment" />}
                  </div>
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