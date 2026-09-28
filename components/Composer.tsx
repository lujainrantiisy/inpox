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

  function enqueue() {
    if (!text.trim() && !file) return
    const item = { conversationId, text: text.trim(), file }
    queueRef.current = [...queueRef.current, item]
    setQueue(queueRef.current)
    setText('')
    setFile(null)
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
          setError(e instanceof Error ? e.message : 'Message could not be submitted')
          break
        }

        queueRef.current = queueRef.current.slice(1)
        setQueue(queueRef.current)

        const preview = item.text || '[image]'
        const update = await supabase
          .from('conversations')
          .update({ last_message: preview, updated_at: new Date().toISOString() })
          .eq('id', item.conversationId)
        if (update.error) setError('Message sent, but the conversation preview could not be updated.')

        const webhook = process.env.NEXT_PUBLIC_N8N_AGENT_WEBHOOK
        if (webhook) {
          try {
            const response = await fetch(webhook, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
              body: JSON.stringify({ conversation_id: item.conversationId }),
            })
            if (!response.ok) throw new Error('Agent notification failed')
          } catch {
            setError('Message sent, but the agent could not be notified.')
          }
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

  return (
    <div className="composer">
      {error && (
        <div className="error-text">
          {error}
          {queue.length > 0 && (
            <button className="btn secondary" onClick={() => void processQueue()} disabled={sending}>
              Retry queued message
            </button>
          )}
        </div>
      )}
      {queue.length > 0 && <div className="attach">{sending ? 'Sending' : 'Queued'}: {queue.length}</div>}
      <div className="attach">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
        />
        {file && <span className="chip">{file.name}</span>}
      </div>
      <div className="field-row">
        <textarea
          placeholder="Type a message as the customer, then press Enter..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="btn" onClick={enqueue} disabled={!text.trim() && !file}>
          {queue.length > 0 ? 'Add to queue' : 'Send'}
        </button>
      </div>
    </div>
  )
}
