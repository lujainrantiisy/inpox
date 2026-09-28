import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const webhookUrl = (
    process.env.N8N_AGENT_WEBHOOK ?? process.env.NEXT_PUBLIC_N8N_AGENT_WEBHOOK ?? ''
  ).trim()

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Agent webhook URL is not configured.' }, { status: 503 })
  }

  let body: { conversation_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
  }

  if (typeof body.conversation_id !== 'string' || !body.conversation_id) {
    return NextResponse.json({ error: 'conversation_id is required.' }, { status: 400 })
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: body.conversation_id }),
      cache: 'no-store',
    })
    const responseBody = await upstream.text()

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not reach the agent webhook.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}