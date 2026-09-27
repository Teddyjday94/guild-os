import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import DemoDashboard from '../dashboard/page'

export const dynamic = 'force-dynamic'

export default async function GuildAppPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims?.sub) {
    redirect('/login?next=/app')
  }

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id, role')
    .eq('user_id', claimsData.claims.sub)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    redirect('/onboarding')
  }

  return <DemoDashboard />
}
