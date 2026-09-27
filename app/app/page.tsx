import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import WorkspaceClient from './workspace-client'

export const dynamic = 'force-dynamic'

export default async function GuildAppPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims?.sub) {
    redirect('/login?next=/app')
  }

  const userId = claimsData.claims.sub
  const { data: membership } = await supabase
    .from('guild_members')
    .select('id, guild_id, role, nickname, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) {
    redirect('/onboarding')
  }

  const [guildResult, eventsResult, membersResult, charactersResult, rsvpsResult, profileResult] = await Promise.all([
    supabase
      .from('guilds')
      .select('id, name, primary_game, region, timezone')
      .eq('id', membership.guild_id)
      .single(),
    supabase
      .from('events')
      .select('id, title, game, description, starts_at, tanks_required, healers_required, dps_required')
      .eq('guild_id', membership.guild_id)
      .order('starts_at', { ascending: true })
      .limit(24),
    supabase
      .from('guild_members')
      .select('id, user_id, role, status, nickname, joined_at')
      .eq('guild_id', membership.guild_id)
      .order('joined_at', { ascending: true }),
    supabase
      .from('characters')
      .select('member_id, name, class_name, specialization, combat_role, is_main')
      .eq('guild_id', membership.guild_id),
    supabase
      .from('event_rsvps')
      .select('id, event_id, member_id, status, combat_role, responded_at')
      .eq('guild_id', membership.guild_id),
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .maybeSingle(),
  ])

  if (!guildResult.data) {
    throw new Error(guildResult.error?.message ?? 'Guild workspace could not be loaded.')
  }

  return (
    <WorkspaceClient
      guild={guildResult.data}
      membership={membership}
      events={eventsResult.data ?? []}
      members={membersResult.data ?? []}
      characters={charactersResult.data ?? []}
      rsvps={rsvpsResult.data ?? []}
      profile={profileResult.data}
    />
  )
}
