'use client'

import Link from 'next/link'
import { Activity, Bell, Bot, CalendarDays, ChevronDown, ClipboardList, Gauge, Megaphone, Plus, Settings, Shield, UsersRound, X } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'

type Status = 'going' | 'maybe' | 'declined'
type Role = 'Tank' | 'Healer' | 'DPS'
type Member = { id: number; name: string; className: string; role: Role; status: Status }
type RaidEvent = { title: string; game: string; date: string; time: string; tanks: number; healers: number; dps: number }

const seed: Member[] = [
  { id: 1, name: 'Nightfall', className: 'Protection Paladin', role: 'Tank', status: 'going' },
  { id: 2, name: 'Raven', className: 'Guardian Druid', role: 'Tank', status: 'going' },
  { id: 3, name: 'Kaelith', className: 'Holy Paladin', role: 'Healer', status: 'going' },
  { id: 4, name: 'Seraph', className: 'Discipline Priest', role: 'Healer', status: 'going' },
  { id: 5, name: 'Nova', className: 'Restoration Shaman', role: 'Healer', status: 'going' },
  { id: 6, name: 'Draven', className: 'Frost Mage', role: 'DPS', status: 'going' },
  { id: 7, name: 'Vex', className: 'Havoc Demon Hunter', role: 'DPS', status: 'going' },
  { id: 8, name: 'Astra', className: 'Marksmanship Hunter', role: 'DPS', status: 'going' },
  { id: 9, name: 'Morrow', className: 'Assassination Rogue', role: 'DPS', status: 'going' },
  { id: 10, name: 'Cypher', className: 'Destruction Warlock', role: 'DPS', status: 'maybe' },
  { id: 11, name: 'Ember', className: 'Fire Mage', role: 'DPS', status: 'declined' },
]

const nav = [
  ['Overview', Gauge], ['Events', CalendarDays], ['Roster', UsersRound], ['Recruitment', ClipboardList], ['Attendance', Activity]
] as const

export default function DashboardPage() {
  const [members, setMembers] = useState(seed)
  const [selfStatus, setSelfStatus] = useState<Status>('going')
  const [open, setOpen] = useState(false)
  const [raid, setRaid] = useState<RaidEvent>({ title: 'Citadel of Ash', game: 'World of Warcraft', date: '2026-10-03', time: '20:00', tanks: 2, healers: 4, dps: 8 })

  const counts = useMemo(() => {
    const going = members.filter(m => m.status === 'going')
    return {
      going: going.length,
      maybe: members.filter(m => m.status === 'maybe').length,
      declined: members.filter(m => m.status === 'declined').length,
      Tank: going.filter(m => m.role === 'Tank').length,
      Healer: going.filter(m => m.role === 'Healer').length,
      DPS: going.filter(m => m.role === 'DPS').length,
    }
  }, [members])

  const needs = [
    { label: 'Tank', have: counts.Tank, need: raid.tanks },
    { label: 'Healer', have: counts.Healer, need: raid.healers },
    { label: 'DPS', have: counts.DPS, need: raid.dps },
  ]

  function cycleMember(id: number) {
    setMembers(current => current.map(member => member.id === id ? {
      ...member,
      status: member.status === 'going' ? 'maybe' : member.status === 'maybe' ? 'declined' : 'going'
    } : member))
  }

  function submitEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setRaid({
      title: String(data.get('title')),
      game: String(data.get('game')),
      date: String(data.get('date')),
      time: String(data.get('time')),
      tanks: Number(data.get('tanks')),
      healers: Number(data.get('healers')),
      dps: Number(data.get('dps')),
    })
    setOpen(false)
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">G</span><span>GUILDOS</span></Link>
        <div className="side-label">Command</div>
        {nav.map(([label, Icon], index) => <a className={`side-link${index === 0 ? ' active' : ''}`} href={`#${label.toLowerCase()}`} key={label}><Icon size={18}/><span>{label}</span></a>)}
        <div className="side-label">Community</div>
        <a className="side-link" href="#discord"><Bot size={18}/><span>Discord</span></a>
        <a className="side-link" href="#announcements"><Megaphone size={18}/><span>Announcements</span></a>
        <div className="side-label">Manage</div>
        <a className="side-link" href="#settings"><Settings size={18}/><span>Settings</span></a>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="guild-select"><div className="guild-emblem">TLG</div><div><strong>The Last Guardians</strong><div className="small">World of Warcraft · North America</div></div><ChevronDown size={16}/></div>
          <div style={{display:'flex', gap:10, alignItems:'center'}}><button className="btn" aria-label="Notifications"><Bell size={17}/></button><div className="avatar">T</div></div>
        </header>

        <div className="eyebrow">Command center</div>
        <h1 style={{fontSize:'clamp(2rem,4vw,3.35rem)', letterSpacing:'-.05em', margin:'8px 0'}}>Good evening, Commander.</h1>
        <div className="small">Change member RSVPs below and the raid composition recalculates instantly.</div>

        <section className="stats">
          <div className="stat"><div className="small">Members</div><div className="stat-value">84</div></div>
          <div className="stat"><div className="small">Upcoming events</div><div className="stat-value">4</div></div>
          <div className="stat"><div className="small">30-day attendance</div><div className="stat-value">91%</div></div>
          <div className="stat"><div className="small">Open applications</div><div className="stat-value">7</div></div>
        </section>

        <div className="dashboard-grid">
          <section className="panel" id="events">
            <div className="panel-title">
              <div><div className="small">NEXT OPERATION</div><h2 className="event-title">{raid.title}</h2><div className="event-meta">{raid.game} · {raid.date} · {raid.time} CST</div></div>
              <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={17}/> New event</button>
            </div>

            <div className="composition">
              {needs.map(item => {
                const missing = Math.max(0, item.need - item.have)
                const width = Math.min(100, item.need ? item.have / item.need * 100 : 100)
                return <div className="role-row" key={item.label}><b>{item.label.toUpperCase()}</b><div className="bar"><span style={{width:`${width}%`}}/></div><span className={`badge ${missing ? 'warn' : 'good'}`}>{item.have}/{item.need}</span></div>
              })}
            </div>

            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:18}}>
              {needs.map(item => {
                const missing = Math.max(0, item.need - item.have)
                return <span className={`badge ${missing ? 'warn' : 'good'}`} key={item.label}>{missing ? `Need ${missing} ${item.label}${missing > 1 ? 's' : ''}` : `${item.label} filled`}</span>
              })}
            </div>

            <div style={{marginTop:28, paddingTop:22, borderTop:'1px solid var(--line)'}}>
              <div className="small">YOUR RSVP</div>
              <div className="rsvp-row">
                {(['going','maybe','declined'] as Status[]).map(status => <button className={`rsvp-btn${selfStatus === status ? ' selected' : ''}`} onClick={() => setSelfStatus(status)} key={status}>{status === 'going' ? '✓ Attending' : status === 'maybe' ? '? Maybe' : '× Decline'}</button>)}
              </div>
            </div>

            <div style={{marginTop:28}}>
              <div className="panel-title"><h3>Raid roster</h3><div className="small">{counts.going} going · {counts.maybe} maybe · {counts.declined} declined</div></div>
              {members.map(member => <button key={member.id} onClick={() => cycleMember(member.id)} style={{width:'100%',border:0,background:'transparent',color:'inherit',padding:0,textAlign:'left'}}>
                <div className="member"><div className="member-info"><div className="member-avatar">{member.name.slice(0,2).toUpperCase()}</div><div><strong>{member.name}</strong><div className="small">{member.className} · {member.role}</div></div></div><span className={`badge ${member.status === 'going' ? 'good' : member.status === 'maybe' ? 'warn' : ''}`}>{member.status}</span></div>
              </button>)}
            </div>
          </section>

          <div style={{display:'grid',gap:16,alignContent:'start'}}>
            <section className="panel">
              <div className="panel-title"><h3>Officer alert</h3><Shield size={18} color="var(--warning)"/></div>
              <p style={{color:'#9cabbe',lineHeight:1.65}}>This roster is short {Math.max(0,raid.healers-counts.Healer)} healer and {Math.max(0,raid.dps-counts.DPS)} DPS. Queue a Discord reminder before roster lock.</p>
              <button className="btn" style={{width:'100%'}}><Bot size={17}/> Queue Discord reminder</button>
            </section>
            <section className="panel">
              <div className="panel-title"><h3>Guild activity</h3><Activity size={18} color="var(--accent)"/></div>
              <div className="activity">
                <div className="activity-item"><span className="activity-dot"/><div><strong style={{color:'white'}}>Kaelith</strong> submitted an application.<div className="small">8 minutes ago</div></div></div>
                <div className="activity-item"><span className="activity-dot"/><div><strong style={{color:'white'}}>Raven</strong> confirmed {raid.title}.<div className="small">23 minutes ago</div></div></div>
                <div className="activity-item"><span className="activity-dot"/><div><strong style={{color:'white'}}>Nightfall</strong> created Tuesday PvP Night.<div className="small">1 hour ago</div></div></div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {open && <div className="modal-backdrop" role="dialog" aria-modal="true">
        <form className="modal" onSubmit={submitEvent}>
          <div className="panel-title"><div><div className="eyebrow">Create operation</div><h2 style={{margin:'7px 0 0'}}>Schedule an event</h2></div><button type="button" className="btn" onClick={() => setOpen(false)} aria-label="Close"><X size={17}/></button></div>
          <div className="field"><label>Event title</label><input name="title" defaultValue={raid.title} required/></div>
          <div className="field"><label>Game</label><select name="game" defaultValue={raid.game}><option>World of Warcraft</option><option>Final Fantasy XIV</option><option>Destiny 2</option><option>Rocket League</option><option>Custom Game</option></select></div>
          <div className="field-grid"><div className="field"><label>Date</label><input name="date" type="date" defaultValue={raid.date} required/></div><div className="field"><label>Start time</label><input name="time" type="time" defaultValue={raid.time} required/></div></div>
          <div className="field-grid"><div className="field"><label>Tanks</label><input name="tanks" type="number" min="0" max="20" defaultValue={raid.tanks}/></div><div className="field"><label>Healers</label><input name="healers" type="number" min="0" max="20" defaultValue={raid.healers}/></div></div>
          <div className="field"><label>DPS / flex</label><input name="dps" type="number" min="0" max="100" defaultValue={raid.dps}/></div>
          <button className="btn btn-primary" style={{width:'100%',marginTop:10}} type="submit">Create operation</button>
        </form>
      </div>}
    </div>
  )
}
