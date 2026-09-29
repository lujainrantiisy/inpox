"use client"

import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type QueuedMessage = {
  conversationId: string
  text: string
  file: File | null
}

export default function Composer({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [queue, setQueue] = useState<QueuedMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const queueRef = useRef<QueuedMessage[]>([])
  const processingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function enqueue() {
    if (!text.trim() && !file) return
    const item = { conversationId, text: text.trim(), file }
    queueRef.current = [...queueRef.current, item]
    setQueue(queueRef.current)
    setText('')
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    void processQueue()
  }

  async function processQueue() {
    if (processingRef.current) return
    processingRef.current = true
    setSending(true)
    setError(null)

    try {
      while (queueRef.current.length > 0) {
        const item = queueRef.current[0]
        let imageUrl: string | null = null

        try {
          if (item.file) {
            const path = item.conversationId + '/' + Date.now() + '-' + item.file.name
            const upload = await supabase.storage.from('inbox-images').upload(path, item.file)
            if (upload.error) throw upload.error
            imageUrl = supabase.storage.from('inbox-images').getPublicUrl(path).data.publicUrl
          }

          const insert = await supabase.from('messages').insert({
            conversation_id: item.conversationId,
            role: 'user',
            body: item.text || null,
            image_url: imageUrl,
          })
          if (insert.error) throw insert.error
        } catch (e) {
          setError(e instanceof Error ? e.message : 'لم يتم تعذر إرسال الرسالة')
          break
        }

        queueRef.current = queueRef.current.slice(1)
        setQueue(queueRef.current)

        const preview = item.text || '[صورة]'
        const update = await supabase
          .from('conversations')
          .update({ last_message: preview, updated_at: new Date().toISOString() })
          .eq('id', item.conversationId)
        if (update.error) setError('تم إرسال الرسالة، ولكن تعذر تحديث معاينة المحادثة.')

        try {
          const response = await fetch('/api/agent-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: item.conversationId }),
          })
          if (!response.ok) {
            const responseBody = await response.text()
            const detail = responseBody.trim().slice(0, 500)
            setError(
              `تم إرسال الرسالة، لكن المساعد الذكي أرجع خطأ HTTP ${response.status}${
                detail ? `: ${detail}` : '.'
              }`,
            )
          }
        } catch (e) {
          const detail = e instanceof Error ? e.message : 'فشل طلب الشبكة'
          setError(`تم إرسال الرسالة، ولكن تعذر إشعار المساعد الذكي: ${detail}`)
        }
      }
    } finally {
      processingRef.current = false
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enqueue()
    }
  }

  // Auto-grow textarea functionality
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="composer">
      {/* Error Message Bar */}
      {error && (
        <div className="error-text" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>{error}</span>
          {queue.length > 0 && (
            <button className="btn secondary" style={{ height: 28, padding: '0 10px', fontSize: 12 }} onClick={() => void processQueue()} disabled={sending}>
              إعادة محاولة الرسالة المعلقة
            </button>
          )}
        </div>
      )}

      {/* Queue Indicator Status */}
      {queue.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pulse-dot" style={{ width: 6, height: 6 }} />
          <span>{sending ? 'جاري الإرسال...' : 'في الانتظار'}: {queue.length}</span>
        </div>
      )}

      {/* Selected File Chip */}
      {file && (
        <div className="file-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
          <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => {
              setFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            aria-label="إزالة الملف"
          >
            ×
          </button>
        </div>
      )}

      {/* Input Field Row */}
      <div className="field-row">
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
        />

        {/* Custom Paperclip Button */}
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="إرفاق صورة"
          title="إرفاق صورة"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>

        {/* Arabic Placeholder Textarea */}
        <textarea
          placeholder="اكتب رسالة كأنك العميل…"
          rows={1}
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={onKeyDown}
        />

        {/* Mirrored Circular Gradient Send Button */}
        <button
          type="button"
          className="btn btn-icon-only"
          onClick={enqueue}
          disabled={!text.trim() && !file}
          aria-label="إرسال"
          title={queue.length > 0 ? 'إضافة إلى الإنتظار' : 'إرسال'}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: 'scaleX(-1)' }} /* Mirrored for RTL */
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  )
}