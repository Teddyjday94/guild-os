'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../lib/supabase/server'

type CreateEventInput = {
  title: string
  game: string
  description?: string
  startsAt: string
  tanks: number
  healers: number
  dps: number
}

type RsvpInput = {
  eventId: string
  status: 'going' | 'maybe' | 'declined'
  combatRole: 'Tank' | 'Healer' | 'DPS'
}

const managerRoles = new Set(['owner', 'admin', 'officer', 'raid_leader'])

async function requireMembership() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    throw new Error('You need to sign in again.')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('guild_members')
    .select('id, guild_id, role, status')
    .eq('user_id', authData.user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (membershipError || !membership) {
    throw new Error('No active guild workspace was found for this account.')
  }

  return { supabase, user: authData.user, membership }
}

export async function createEvent(input: CreateEventInput) {
  const { supabase, user, membership } = await requireMembership()

  if (!managerRoles.has(membership.role)) {
    throw new Error('Your guild role cannot create events.')
  }

  const title = input.title.trim()
  const game = input.game.trim()
  const startsAt = new Date(input.startsAt)
  const tanks = Math.max(0, Math.min(20, Math.trunc(input.tanks)))
  const healers = Math.max(0, Math.min(20, Math.trunc(input.healers)))
  const dps = Math.max(0, Math.min(100, Math.trunc(input.dps)))

  if (title.length < 2 || title.length > 100) {
    throw new Error('Event title must be between 2 and 100 characters.')
  }

  if (!game || Number.isNaN(startsAt.getTime())) {
    throw new Error('Add a valid game, date, and start time.')
  }

  const { error } = await supabase.from('events').insert({
    guild_id: membership.guild_id,
    creator_id: user.id,
    title,
    game,
    description: input.description?.trim() || null,
    starts_at: startsAt.toISOString(),
    tanks_required: tanks,
    healers_required: healers,
    dps_required: dps,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/app')
}

export async function submitRsvp(input: RsvpInput) {
  const { supabase, membership } = await requireMembership()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, guild_id')
    .eq('id', input.eventId)
    .eq('guild_id', membership.guild_id)
    .maybeSingle()

  if (eventError || !event) {
    throw new Error('That event is not available in your guild.')
  }

  const { error } = await supabase.from('event_rsvps').upsert(
    {
      guild_id: membership.guild_id,
      event_id: event.id,
      member_id: membership.id,
      status: input.status,
      combat_role: input.combatRole,
      responded_at: new Date().toISOString(),
    },
    { onConflict: 'event_id,member_id' }
  )

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/app')
}
