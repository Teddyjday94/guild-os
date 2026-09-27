'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export async function createGuild(formData: FormData) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    redirect('/login?next=/onboarding')
  }

  const name = String(formData.get('name') ?? '').trim()
  const primaryGame = String(formData.get('primaryGame') ?? 'Custom Game').trim()
  const region = String(formData.get('region') ?? '').trim()
  const timezone = String(formData.get('timezone') ?? 'America/Chicago').trim()

  if (name.length < 2 || name.length > 80) {
    throw new Error('Guild name must be between 2 and 80 characters.')
  }

  const baseSlug = slugify(name) || 'guild'

  let { data: guild, error: guildError } = await supabase
    .from('guilds')
    .insert({
      owner_id: authData.user.id,
      name,
      slug: baseSlug,
      primary_game: primaryGame || 'Custom Game',
      region: region || null,
      timezone: timezone || 'America/Chicago',
    })
    .select('id')
    .single()

  if (guildError?.code === '23505') {
    const uniqueSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`
    const retry = await supabase
      .from('guilds')
      .insert({
        owner_id: authData.user.id,
        name,
        slug: uniqueSlug,
        primary_game: primaryGame || 'Custom Game',
        region: region || null,
        timezone: timezone || 'America/Chicago',
      })
      .select('id')
      .single()

    guild = retry.data
    guildError = retry.error
  }

  if (guildError || !guild) {
    throw new Error(guildError?.message ?? 'Could not create guild.')
  }

  const { error: memberError } = await supabase.from('guild_members').insert({
    guild_id: guild.id,
    user_id: authData.user.id,
    role: 'owner',
    status: 'active',
  })

  if (memberError) {
    throw new Error(memberError.message)
  }

  redirect('/app')
}
