"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import Composer from '../components/Composer'
import LoginForm from '../components/LoginForm'

const ADMIN_EMAIL = 'lujain@ideeps.ai'
const MOOD_EMOJI: Record<string, string> = { negative: '😡', neutral: '🙂', positive: '😍' }
type Language = 'ar' | 'en'

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
  const router = useRouter()
  const [authStatus, setAuthStatus] = useState<'checking' | 'in' | 'out'>('checking')
  const [isAdmin, setIsAdmin] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [moods, setMoods] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const activeIdRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const text = language === 'ar'
    ? {
        inbox: 'صندوق الوارد', newChat: 'محادثة جديدة', dashboard: 'لوحة التحكم', signOut: 'تسجيل الخروج', language: 'English',
        search: 'البحث في المحادثات...', searchLabel: 'البحث في المحادثات', moodLabel: 'التصفية حسب المزاج', all: 'الكل',
        loading: 'جاري تحميل المحادثات...', failed: 'تعذر تحميل المحادثات.', retry: 'إعادة المحاولة', noConversations: 'لا توجد محادثات بعد',
        noMatches: 'لم يتم العثور على محادثات مطابقة', select: 'اختر محادثة للبدء', active: 'الوكيل نشط', human: 'يحتاج موظفاً',
        ai: 'الوكيل الذكي', attachment: 'مرفق', back: 'العودة للقائمة',
      }
    : {
        inbox: 'Inbox', newChat: '+ New Chat', dashboard: '📊 Dashboard', signOut: 'Sign Out', language: 'عربي',
        search: 'Search conversations...', searchLabel: 'Search conversations', moodLabel: 'Filter by mood', all: 'All',
        loading: 'Loading conversations...', failed: 'Failed to load conversations.', retry: 'Retry', noConversations: 'No conversations yet',
        noMatches: 'No matching conversations found', select: 'Select a conversation to start', active: 'Agent active', human: 'Human needed',
        ai: 'AI Agent', attachment: 'Attachment', back: 'Back to list',
      }

  useEffect(() => {
    const direction = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.dir = direction
    document.documentElement.lang = language
    document.body.dir = direction
  }, [language])

  async function loadMoods(ids: string[]) {
    if (ids.length === 0) { setMoods({}); return }
    const { data, error } = await supabase
      .from('agent_decisions')
      .select('conversation_id, mood, created_at')
      .in('conversation_id', ids)
      .not('mood', 'is', null)
      .order('created_at', { ascending: false })
    if (error || !data) return
    const map: Record<string, string> = {}
    for (const row of data) if (!(row.conversation_id in map)) map[row.conversation_id] = row.mood
    setMoods(map)
  }

  async function loadConversations() {
    const { data, error } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false })
    if (error) setLoadError(error.message)
    else {
      setLoadError(null)
      const list = (data as Conversation[]) || []
      setConversations(list)
      loadMoods(list.map((conversation) => conversation.id))
    }
    setLoading(false)
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])
  }

  async function signOut() {
    await supabase.auth.signOut()
    setConversations([]); setMessages([]); setActiveId(null); setIsAdmin(false); setMoods({}); setLoading(true)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      setAuthStatus(data.session ? 'in' : 'out')
      setIsAdmin(user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      setAuthStatus(session ? 'in' : 'out')
      setIsAdmin(user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (authStatus !== 'in') return
    loadConversations()
    const channel = supabase
      .channel('inbox-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, loadConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        loadConversations()
        const id = activeIdRef.current
        const changedConversationId = (payload.new as Partial<Message> | null)?.conversation_id ?? (payload.old as Partial<Message> | null)?.conversation_id
        if (id && (!changedConversationId || changedConversationId === id)) loadMessages(id)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [authStatus])

  useEffect(() => {
    activeIdRef.current = activeId
    if (activeId) loadMessages(activeId); else setMessages([])
  }, [activeId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function seedDemo() {
    const customerName = window.prompt(language === 'ar' ? 'أدخل اسم العميل:' : 'Enter customer name:', language === 'ar' ? 'زائر الموقع' : 'Website Visitor') || (language === 'ar' ? 'زائر الموقع' : 'Website Visitor')
    const { data } = await supabase.from('conversations').insert({ contact: customerName, channel: 'web', last_message: language === 'ar' ? 'محادثة جديدة' : 'New conversation' }).select().single()
    if (data) { await loadConversations(); setActiveId((data as Conversation).id) }
  }

  function formatTime(dateStr?: string) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  function renderChannelBadge(channelName: string) {
    const channel = channelName.toLowerCase()
    const label = language === 'ar' ? ({ instagram: 'انستغرام', whatsapp: 'واتساب', facebook: 'فيسبوك', web: 'ويب' }[channel] || channelName) : channelName.toUpperCase()
    return <span className="channel-pill">{label}</span>
  }

  if (authStatus === 'checking') return <div className="empty" style={{ height: '100vh' }}><span>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span></div>
  if (authStatus === 'out') return <LoginForm />

  const active = conversations.find((conversation) => conversation.id === activeId) || null
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = !normalizedSearch || conversation.contact.toLowerCase().includes(normalizedSearch) || (conversation.last_message ?? '').toLowerCase().includes(normalizedSearch)
    return matchesSearch && (!selectedMood || moods[conversation.id] === selectedMood)
  })

  return (
    <div className={`app ${activeId ? 'mobile-chat-open' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <aside className="sidebar">
        <div className="sidebar-header" style={{ paddingBottom: 12 }}>
          <div className="sidebar-title-row"><span className="glowing-dot" /><h1>{text.inbox}</h1></div>
          <div className="sidebar-actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={seedDemo}>{text.newChat}</button>
            {isAdmin && <button className="btn secondary" onClick={() => router.push('/agent-dashboard?key=2299220055&filter=flagged')}>{text.dashboard}</button>}
            <button className="btn secondary" onClick={signOut} aria-label={text.signOut}>{text.signOut}</button>
            <button className="btn secondary language-toggle" type="button" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'} title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}>🌐 {text.language}</button>
          </div>
        </div>

        <div className="sidebar-filters">
          <div className="search-control">
            <input className="search-input" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={text.search} aria-label={text.searchLabel} />
            <svg className="search-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          </div>
          <div className="mood-filters" aria-label={text.moodLabel}>
            {([{ value: null, label: text.all }, { value: 'negative', label: '😡' }, { value: 'neutral', label: '🙂' }, { value: 'positive', label: '😍' }] as const).map((option) => <button key={option.label} type="button" onClick={() => setSelectedMood(option.value)} aria-pressed={selectedMood === option.value} aria-label={option.value ? `${option.value} mood` : text.all} className={selectedMood === option.value ? 'mood-filter active' : 'mood-filter'}>{option.label}</button>)}
          </div>
        </div>

        <div className="convo-list">
          {loading && <div className="empty"><span>{text.loading}</span></div>}
          {!loading && loadError && <div className="empty error-state">{text.failed}<button className="btn secondary" onClick={loadConversations}>{text.retry}</button></div>}
          {!loading && !loadError && conversations.length === 0 && <div className="empty"><span>{text.noConversations}</span></div>}
          {!loading && !loadError && conversations.length > 0 && filteredConversations.length === 0 && <div className="empty"><span>{text.noMatches}</span></div>}
          {filteredConversations.map((conversation) => <div key={conversation.id} className={'convo' + (conversation.id === activeId ? ' active' : '')} onClick={() => setActiveId(conversation.id)}><div className="convo-avatar">{conversation.contact ? conversation.contact.charAt(0).toUpperCase() : 'U'}</div><div className="convo-info"><div className="top"><span className="name">{conversation.contact}</span>{moods[conversation.id] && <span className="mood-badge" title={moods[conversation.id]}>{MOOD_EMOJI[moods[conversation.id]]}</span>}<span className="convo-time">{formatTime(conversation.updated_at)}</span></div><div className="convo-bottom"><span className="preview">{conversation.last_message || (language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet')}</span>{renderChannelBadge(conversation.channel)}{conversation.unread > 0 && <span className="unread-dot" />}</div></div></div>)}
        </div>
      </aside>

      <main className="thread">
        {!active && <div className="empty"><span>{text.select}</span></div>}
        {active && <>
          <div className="thread-header"><div className="header-user-info"><button className="mobile-back-btn" onClick={() => setActiveId(null)} aria-label={text.back}>←</button><span className="header-user-name">{active.contact}</span>{renderChannelBadge(active.channel)}{active.needs_human && <span className="human-needed">⚠ {text.human}</span>}</div><div className="agent-status"><span className="pulse-dot" /><span>{text.active}</span></div></div>
          <div className="messages">{messages.map((message) => <div key={message.id} className={'row ' + message.role}>{message.role === 'agent' && <div className="agent-label">{text.ai}</div>}<div className={'bubble ' + message.role}>{message.body}{message.image_url && <img src={message.image_url} alt={text.attachment} />}</div><span className="msg-time">{formatTime(message.created_at)}</span></div>)}<div ref={bottomRef} /></div>
          <Composer conversationId={active.id} />
        </>}
      </main>
    </div>
  )
}
