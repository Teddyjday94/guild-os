import { redirect } from 'next/navigation'
import { Bot, Gamepad2, ShieldCheck } from 'lucide-react'
import { createClient } from '../../lib/supabase/server'
import { createGuild } from './actions'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims?.sub) {
    redirect('/login?next=/onboarding')
  }

  const userId = claimsData.claims.sub
  const { data: existingMembership } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existingMembership) {
    redirect('/app')
  }

  return (
    <main className="shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', paddingBlock: 48 }}>
      <section className="panel" style={{ width: 'min(100%, 720px)', padding: 32 }}>
        <div className="eyebrow">Guild setup</div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 7vw, 3.6rem)', letterSpacing: '-.05em', margin: '10px 0 12px' }}>
          Build your command center.
        </h1>
        <p style={{ color: '#9cabbe', lineHeight: 1.7, maxWidth: 620 }}>
          Create the first guild workspace. You can connect the Discord server and import members after the workspace exists.
        </p>

        <form action={createGuild} style={{ marginTop: 28, display: 'grid', gap: 18 }}>
          <div className="field">
            <label htmlFor="name">Guild / community name</label>
            <input id="name" name="name" placeholder="The Last Guardians" minLength={2} maxLength={80} required />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="primaryGame">Primary game</label>
              <select id="primaryGame" name="primaryGame" defaultValue="World of Warcraft">
                <option>World of Warcraft</option>
                <option>Final Fantasy XIV</option>
                <option>Destiny 2</option>
                <option>Rocket League</option>
                <option>Custom Game</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="region">Region</label>
              <select id="region" name="region" defaultValue="North America">
                <option>North America</option>
                <option>Europe</option>
                <option>Oceania</option>
                <option>Asia</option>
                <option>South America</option>
                <option>Global</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="timezone">Timezone</label>
            <select id="timezone" name="timezone" defaultValue="America/Chicago">
              <option value="America/Chicago">Central Time</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">UK / London</option>
              <option value="Europe/Berlin">Central Europe</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', paddingBlock: 14 }}>
            <Gamepad2 size={18} /> Create guild workspace
          </button>
        </form>

        <div style={{ display: 'grid', gap: 10, marginTop: 26, color: '#7f91a8', fontSize: '.9rem' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><ShieldCheck size={17} /> You become the owner of this workspace.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Bot size={17} /> Discord server permissions are connected in a separate step.</div>
        </div>
      </section>
    </main>
  )
}
