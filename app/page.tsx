import Link from 'next/link'
import { ArrowRight, Bot, CalendarDays, ChartNoAxesCombined, Check, Gamepad2, Shield, UsersRound } from 'lucide-react'

const features = [
  { icon: CalendarDays, title: 'Raid scheduling', body: 'Create one-off or recurring events with role requirements, availability, and a clear roster at a glance.' },
  { icon: UsersRound, title: 'Living guild roster', body: 'Track members, mains, alts, guild rank, preferred roles, and attendance without maintaining a spreadsheet.' },
  { icon: Bot, title: 'Discord automation', body: 'Bring RSVP buttons, reminders, upcoming events, and roster checks directly into the server your guild already uses.' },
  { icon: ChartNoAxesCombined, title: 'Attendance history', body: 'See who consistently shows, spot roster gaps early, and give officers a real operational view of the team.' },
  { icon: Shield, title: 'Recruitment pipeline', body: 'Publish your openings, collect applications, and move recruits from review to interview to accepted.' },
  { icon: Gamepad2, title: 'Built for multiple games', body: 'Support MMO raids, competitive teams, clans, and custom communities without forcing one game model on everyone.' },
]

const plans = [
  { name: 'Free', price: '$0', note: 'For new guilds', items: ['1 guild', 'Up to 50 members', '5 events per month', 'Basic recruitment', 'Discord bot'] },
  { name: 'Guild Pro', price: '$14.99', note: 'For active guilds', featured: true, items: ['Up to 250 members', 'Unlimited events', 'Recurring raids', 'Attendance analytics', 'Advanced Discord reminders'] },
  { name: 'Guild Network', price: '$39.99', note: 'For large communities', items: ['Multiple guilds', 'Multiple Discord servers', 'Unlimited members', 'Cross-guild events', 'Advanced permissions'] },
]

export default function Home() {
  return (
    <>
      <nav className="nav">
        <Link className="brand" href="/"><span className="brand-mark">G</span><span>GUILDOS</span></Link>
        <div className="nav-links"><a href="#features">Features</a><a href="#pricing">Pricing</a><Link href="/dashboard">Demo</Link></div>
        <div className="nav-actions"><Link className="btn" href="/dashboard">Sign in</Link><Link className="btn btn-primary" href="/dashboard">Open demo <ArrowRight size={16}/></Link></div>
      </nav>

      <main className="shell">
        <section className="hero">
          <div>
            <div className="eyebrow">The command center for gaming communities</div>
            <h1>Run your guild.<br/>Rally your team.</h1>
            <p>GuildOS turns Discord-based guild management into one clean operating system for events, rosters, recruitment, attendance, and officer coordination.</p>
            <div className="hero-actions"><Link className="btn btn-primary" href="/dashboard">Launch live demo <ArrowRight size={17}/></Link><a className="btn" href="#features">Explore GuildOS</a></div>
            <div className="hero-note">No credit card · Discord-first · Built for guilds, clans, and competitive communities</div>
          </div>

          <div className="command-card">
            <div className="card-top">
              <div><div className="small">NEXT OPERATION</div><h3 style={{margin:'7px 0 0'}}>The Last Guardians</h3></div>
              <span className="status"><span className="dot"/> Live roster</span>
            </div>
            <div className="operation">
              <div className="small">SATURDAY · 8:00 PM CST</div>
              <h3>Citadel of Ash</h3>
              <div className="small">Starts in 2d 17h · 17 attending</div>
              <div style={{marginTop:20}}>
                <div className="role-row"><b>TANK</b><div className="bar"><span style={{width:'100%'}}/></div><span>2/2</span></div>
                <div className="role-row"><b>HEALER</b><div className="bar"><span style={{width:'75%'}}/></div><span>3/4</span></div>
                <div className="role-row"><b>DPS</b><div className="bar"><span style={{width:'86%'}}/></div><span>12/14</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="logo-strip"><div className="logo-pill">WORLD OF WARCRAFT</div><div className="logo-pill">FINAL FANTASY XIV</div><div className="logo-pill">DESTINY 2</div><div className="logo-pill">ROCKET LEAGUE</div><div className="logo-pill">CUSTOM GAME</div></div>

        <section className="section" id="features">
          <div className="section-head"><div className="eyebrow">One place for guild operations</div><h2>Less admin. More game night.</h2><p>GuildOS is deliberately focused on the jobs officers repeat every week: filling events, knowing who is available, organizing people, and keeping Discord informed.</p></div>
          <div className="feature-grid">{features.map(({icon:Icon,title,body}) => <article className="feature" key={title}><div className="icon-box"><Icon size={20}/></div><strong>{title}</strong><p>{body}</p></article>)}</div>
        </section>

        <section className="section" id="pricing">
          <div className="section-head"><div className="eyebrow">Simple pricing</div><h2>Start free. Upgrade when the guild grows.</h2></div>
          <div className="pricing">{plans.map(plan => <article className={`price-card${plan.featured ? ' featured' : ''}`} key={plan.name}><div className="small">{plan.note}</div><h3>{plan.name}</h3><div className="price">{plan.price}<span>{plan.price !== '$0' ? '/month' : ''}</span></div><ul>{plan.items.map(item => <li key={item}><Check size={15} style={{verticalAlign:'-2px',marginRight:8,color:'var(--accent)'}}/>{item}</li>)}</ul><Link className={`btn ${plan.featured ? 'btn-primary' : ''}`} style={{width:'100%',marginTop:10}} href="/dashboard">Try the demo</Link></article>)}</div>
        </section>

        <footer className="footer"><div className="brand"><span className="brand-mark">G</span><span>GUILDOS</span></div><div>Run your guild. Rally your team.</div></footer>
      </main>
    </>
  )
}
