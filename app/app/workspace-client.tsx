'use client'

import {
  Activity,
  Bot,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Gauge,
  Megaphone,
  Plus,
  Settings,
  Shield,
  UsersRound,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, submitRsvp } from './actions'

type Guild = {
  id: string
  name: string
  primary_game: string
  region: string | null
  timezone: string
}

type Membership = {
  id: string
  guild_id: string
  role: string
  nickname: string | null
  status: string
}

type EventRow = {
  id: string
  title: string
  game: string
  description: string | null
  starts_at: string
  tanks_required: number
  healers_required: number
  dps_required: number
}

type MemberRow = {
  id: string
  user_id: string
  role: string
  status: string
  nickname: string | null
  joined_at: string
}

type CharacterRow = {
  member_id: string
  name: string
  class_name: string | null
  specialization: string | null
  combat_role: string | null
  is_main: boolean
}

type RsvpRow = {
  id: string
  event_id: string
  member_id: string
  status: 'going' | 'maybe' | 'declined'
  combat_role: string | null
  responded_at: string
}

type Profile = {
  username: string
  avatar_url: string | null
}

type Props = {
  guild: Guild
  membership: Membership
  events: EventRow[]
  members: MemberRow[]
  characters: CharacterRow[]
  rsvps: RsvpRow[]
  profile: Profile | null
}

const nav = [
  ['Overview', Gauge],
  ['Events', CalendarDays],
  ['Roster', UsersRound],
  ['Recruitment', ClipboardList],
  ['Attendance', Activity],
] as const

const managerRoles = new Set(['owner', 'admin', 'officer', 'raid_leader'])

export default function WorkspaceClient({ guild, membership, events, members, characters, rsvps, profile }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? '')
  const [eventModal, setEventModal] = useState(false)
  const [status, setStatus] = useState<'going' | 'maybe' | 'declined'>('going')
  const [combatRole, setCombatRole] = useState<'Tank' | 'Healer' | 'DPS'>('DPS')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedEvent = events.find((event) => event.id === selectedId) ?? events[0] ?? null
  const selectedRsvps = selectedEvent ? rsvps.filter((rsvp) => rsvp.event_id === selectedEvent.id) : []
  const myStoredRsvp = selectedEvent ? selectedRsvps.find((rsvp) => rsvp.member_id === membership.id) : undefined

  const counts = useMemo(() => {
    const going = selectedRsvps.filter((rsvp) => rsvp.status === 'going')
    return {
      going: going.length,
      maybe: selectedRsvps.filter((rsvp) => rsvp.status === 'maybe').length,
      declined: selectedRsvps.filter((rsvp) => rsvp.status === 'declined').length,
      Tank: going.filter((rsvp) => rsvp.combat_role === 'Tank').length,
      Healer: going.filter((rsvp) => rsvp.combat_role === 'Healer').length,
      DPS: going.filter((rsvp) => rsvp.combat_role === 'DPS').length,
    }
  }, [selectedRsvps])

  const needs = selectedEvent
    ? [
        { label: 'Tank' as const, have: counts.Tank, need: selectedEvent.tanks_required },
        { label: 'Healer' as const, have: counts.Healer, need: selectedEvent.healers_required },
        { label: 'DPS' as const, have: counts.DPS, need: selectedEvent.dps_required },
      ]
    : []

  const shortages = needs
    .map((item) => ({ ...item, missing: Math.max(0, item.need - item.have) }))
    .filter((item) => item.missing > 0)

  const activeMembers = members.filter((member) => member.status === 'active')
  const upcomingEvents = events.filter((event) => new Date(event.starts_at).getTime() >= Date.now())
  const canManage = managerRoles.has(membership.role)

  function mainCharacter(memberId: string) {
    return characters.find((character) => character.member_id === memberId && character.is_main)
      ?? characters.find((character) => character.member_id === memberId)
  }

  function memberName(member: MemberRow) {
    const character = mainCharacter(member.id)
    if (character?.name) return character.name
    if (member.nickname) return member.nickname
    if (member.id === membership.id && profile?.username) return profile.username
    return 'Guild member'
  }

  function formatEventTime(value: string) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: guild.timezone,
        timeZoneName: 'short',
      }).format(new Date(value))
    } catch {
      return new Date(value).toLocaleString()
    }
  }

  function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const date = String(form.get('date') ?? '')
    const time = String(form.get('time') ?? '')
    const localDate = new Date(`${date}T${time}`)

    if (Number.isNaN(localDate.getTime())) {
      setError('Choose a valid event date and time.')
      return
    }

    startTransition(async () => {
      try {
        await createEvent({
          title: String(form.get('title') ?? ''),
          game: String(form.get('game') ?? guild.primary_game),
          description: String(form.get('description') ?? ''),
          startsAt: localDate.toISOString(),
          tanks: Number(form.get('tanks') ?? 0),
          healers: Number(form.get('healers') ?? 0),
          dps: Number(form.get('dps') ?? 0),
        })
        setEventModal(false)
        router.refresh()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not create the event.')
      }
    })
  }

  function handleRsvp() {
    if (!selectedEvent) return
    setError(null)

    startTransition(async () => {
      try {
        await submitRsvp({ eventId: selectedEvent.id, status, combatRole })
        router.refresh()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not save your RSVP.')
      }
    })
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">G</span><span>GUILDOS</span></Link>
        <div className="side-label">Command</div>
        {nav.map(([label, Icon], index) => (
          <a className={`side-link${index === 0 ? ' active' : ''}`} href={`#${label.toLowerCase()}`} key={label}>
            <Icon size={18}/><span>{label}</span>
          </a>
        ))}
        <div className="side-label">Community</div>
        <a className="side-link" href="#discord"><Bot size={18}/><span>Discord</span></a>
        <a className="side-link" href="#announcements"><Megaphone size={18}/><span>Announcements</span></a>
        <div className="side-label">Manage</div>
        <a className="side-link" href="#settings"><Settings size={18}/><span>Settings</span></a>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="guild-select">
            <div className="guild-emblem">{guild.name.slice(0, 3).toUpperCase()}</div>
            <div><strong>{guild.name}</strong><div className="small">{guild.primary_game}{guild.region ? ` · ${guild.region}` : ''}</div></div>
            <ChevronDown size={16}/>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge good">{membership.role.replace('_', ' ')}</span>
            <div className="avatar">{(profile?.username ?? 'G').slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <div className="eyebrow">Live guild workspace</div>
        <h1 style={{ fontSize: 'clamp(2rem,4vw,3.35rem)', letterSpacing: '-.05em', margin: '8px 0' }}>
          {guild.name} command center
        </h1>
        <div className="small">Events and RSVPs on this page are stored in your GuildOS database.</div>

        <section className="stats">
          <div className="stat"><div className="small">Active members</div><div className="stat-value">{activeMembers.length}</div></div>
          <div className="stat"><div className="small">Upcoming events</div><div className="stat-value">{upcomingEvents.length}</div></div>
          <div className="stat"><div className="small">Next event going</div><div className="stat-value">{counts.going}</div></div>
          <div className="stat"><div className="small">Role shortages</div><div className="stat-value">{shortages.length}</div></div>
        </section>

        {error && <div className="panel" style={{ borderColor: 'var(--warning)', marginBottom: 16 }}>{error}</div>}

        <div className="dashboard-grid">
          <section className="panel" id="events">
            <div className="panel-title">
              <div>
                <div className="small">UPCOMING OPERATIONS</div>
                <h2 className="event-title">{selectedEvent?.title ?? 'No events scheduled'}</h2>
                {selectedEvent && <div className="event-meta">{selectedEvent.game} · {formatEventTime(selectedEvent.starts_at)}</div>}
              </div>
              {canManage && <button className="btn btn-primary" onClick={() => setEventModal(true)}><Plus size={17}/> New event</button>}
            </div>

            {events.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
                {events.map((event) => (
                  <button
                    key={event.id}
                    className={`btn${event.id === selectedEvent?.id ? ' btn-primary' : ''}`}
                    onClick={() => setSelectedId(event.id)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            )}

            {!selectedEvent ? (
              <div style={{ padding: '36px 0', color: '#9cabbe', lineHeight: 1.7 }}>
                {canManage ? 'Create the first guild event to start collecting RSVPs and tracking role coverage.' : 'An officer has not scheduled an event yet.'}
              </div>
            ) : (
              <>
                {selectedEvent.description && <p style={{ color: '#9cabbe', lineHeight: 1.65 }}>{selectedEvent.description}</p>}

                <div className="composition">
                  {needs.map((item) => {
                    const missing = Math.max(0, item.need - item.have)
                    const width = Math.min(100, item.need ? item.have / item.need * 100 : 100)
                    return (
                      <div className="role-row" key={item.label}>
                        <b>{item.label.toUpperCase()}</b>
                        <div className="bar"><span style={{ width: `${width}%` }}/></div>
                        <span className={`badge ${missing ? 'warn' : 'good'}`}>{item.have}/{item.need}</span>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                  {needs.map((item) => {
                    const missing = Math.max(0, item.need - item.have)
                    return <span className={`badge ${missing ? 'warn' : 'good'}`} key={item.label}>{missing ? `Need ${missing} ${item.label}${missing > 1 ? 's' : ''}` : `${item.label} filled`}</span>
                  })}
                </div>

                <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--line)' }}>
                  <div className="panel-title">
                    <div><div className="small">YOUR RSVP</div>{myStoredRsvp && <div className="small">Saved: {myStoredRsvp.status} · {myStoredRsvp.combat_role ?? 'No role'}</div>}</div>
                  </div>
                  <div className="rsvp-row">
                    {(['going', 'maybe', 'declined'] as const).map((item) => (
                      <button className={`rsvp-btn${status === item ? ' selected' : ''}`} onClick={() => setStatus(item)} key={item}>
                        {item === 'going' ? '✓ Attending' : item === 'maybe' ? '? Maybe' : '× Decline'}
                      </button>
                    ))}
                  </div>
                  <div className="field" style={{ marginTop: 14 }}>
                    <label htmlFor="combatRole">Role for this event</label>
                    <select id="combatRole" value={combatRole} onChange={(event) => setCombatRole(event.target.value as 'Tank' | 'Healer' | 'DPS')}>
                      <option>Tank</option><option>Healer</option><option>DPS</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={handleRsvp} disabled={isPending} style={{ marginTop: 12 }}>
                    {isPending ? 'Saving…' : 'Save RSVP'}
                  </button>
                </div>

                <div style={{ marginTop: 28 }} id="roster">
                  <div className="panel-title"><h3>Event roster</h3><div className="small">{counts.going} going · {counts.maybe} maybe · {counts.declined} declined</div></div>
                  {activeMembers.map((member) => {
                    const rsvp = selectedRsvps.find((item) => item.member_id === member.id)
                    const character = mainCharacter(member.id)
                    return (
                      <div className="member" key={member.id}>
                        <div className="member-info">
                          <div className="member-avatar">{memberName(member).slice(0, 2).toUpperCase()}</div>
                          <div>
                            <strong>{memberName(member)}</strong>
                            <div className="small">
                              {character?.class_name ?? member.role.replace('_', ' ')}
                              {character?.combat_role ? ` · ${character.combat_role}` : ''}
                            </div>
                          </div>
                        </div>
                        <span className={`badge ${rsvp?.status === 'going' ? 'good' : rsvp?.status === 'maybe' ? 'warn' : ''}`}>{rsvp?.status ?? 'no response'}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </section>

          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <section className="panel">
              <div className="panel-title"><h3>Officer alert</h3><Shield size={18} color="var(--warning)"/></div>
              {selectedEvent ? (
                shortages.length ? (
                  <p style={{ color: '#9cabbe', lineHeight: 1.65 }}>
                    Current roster needs {shortages.map((item) => `${item.missing} ${item.label}${item.missing > 1 ? 's' : ''}`).join(', ')} before the target composition is filled.
                  </p>
                ) : <p style={{ color: '#9cabbe', lineHeight: 1.65 }}>All required roles are currently filled.</p>
              ) : <p style={{ color: '#9cabbe', lineHeight: 1.65 }}>Schedule an event to begin composition tracking.</p>}
              <button className="btn" style={{ width: '100%' }} disabled><Bot size={17}/> Discord reminder coming next</button>
            </section>

            <section className="panel">
              <div className="panel-title"><h3>Guild snapshot</h3><Activity size={18} color="var(--accent)"/></div>
              <div className="activity">
                <div className="activity-item"><span className="activity-dot"/><div><strong style={{ color: 'white' }}>{activeMembers.length}</strong> active member{activeMembers.length === 1 ? '' : 's'}<div className="small">Live database count</div></div></div>
                <div className="activity-item"><span className="activity-dot"/><div><strong style={{ color: 'white' }}>{upcomingEvents.length}</strong> upcoming event{upcomingEvents.length === 1 ? '' : 's'}<div className="small">Guild schedule</div></div></div>
                <div className="activity-item"><span className="activity-dot"/><div><strong style={{ color: 'white' }}>{guild.timezone}</strong><div className="small">Guild timezone</div></div></div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {eventModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal" onSubmit={handleCreateEvent}>
            <div className="panel-title">
              <div><div className="eyebrow">Create operation</div><h2 style={{ margin: '7px 0 0' }}>Schedule an event</h2></div>
              <button type="button" className="btn" onClick={() => setEventModal(false)} aria-label="Close"><X size={17}/></button>
            </div>
            <div className="field"><label>Event title</label><input name="title" placeholder="Citadel of Ash" required minLength={2} maxLength={100}/></div>
            <div className="field"><label>Game</label><input name="game" defaultValue={guild.primary_game} required/></div>
            <div className="field"><label>Description</label><textarea name="description" rows={3} placeholder="Roster lock, voice channel, strategy notes…"/></div>
            <div className="field-grid">
              <div className="field"><label>Date</label><input name="date" type="date" required/></div>
              <div className="field"><label>Start time</label><input name="time" type="time" required/></div>
            </div>
            <div className="field-grid">
              <div className="field"><label>Tanks</label><input name="tanks" type="number" min="0" max="20" defaultValue="2"/></div>
              <div className="field"><label>Healers</label><input name="healers" type="number" min="0" max="20" defaultValue="4"/></div>
            </div>
            <div className="field"><label>DPS / flex</label><input name="dps" type="number" min="0" max="100" defaultValue="8"/></div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} type="submit" disabled={isPending}>{isPending ? 'Creating…' : 'Create operation'}</button>
          </form>
        </div>
      )}
    </div>
  )
}
