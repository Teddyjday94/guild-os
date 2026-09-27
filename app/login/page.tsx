'use client'

import Link from 'next/link'
import { Bot, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signInWithDiscord() {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams(window.location.search)
    const requestedNext = params.get('next')
    const next = requestedNext?.startsWith('/') ? requestedNext : '/onboarding'
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    }
  }

  return (
    <main className="shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', paddingBlock: 48 }}>
      <section className="panel" style={{ width: 'min(100%, 540px)', padding: 32 }}>
        <Link className="brand" href="/" style={{ marginBottom: 28, display: 'inline-flex' }}>
          <span className="brand-mark">G</span><span>GUILDOS</span>
        </Link>

        <div className="eyebrow">Commander access</div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 7vw, 3.5rem)', letterSpacing: '-.05em', margin: '10px 0 12px' }}>
          Your guild starts in Discord.
        </h1>
        <p style={{ color: '#9cabbe', lineHeight: 1.7, marginBottom: 26 }}>
          Sign in with Discord to create your GuildOS workspace, schedule events, and start building a live roster.
        </p>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', paddingBlock: 14 }} onClick={signInWithDiscord} disabled={loading}>
          {loading ? <LoaderCircle size={18} className="spin" /> : <Bot size={18} />}
          {loading ? 'Connecting…' : 'Continue with Discord'}
        </button>

        {error && <p style={{ color: 'var(--warning)', marginTop: 14 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 24, color: '#7f91a8', fontSize: '.88rem', lineHeight: 1.5 }}>
          <ShieldCheck size={18} style={{ flex: '0 0 auto', marginTop: 2 }} />
          <span>GuildOS uses Discord for identity. Server connections and bot permissions are handled separately.</span>
        </div>
      </section>
    </main>
  )
}
