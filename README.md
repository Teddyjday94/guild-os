# GuildOS

**Run your guild. Rally your team.**

GuildOS is a Discord-first operating system for gaming guilds, clans, and communities. The first milestone focuses on event scheduling, RSVP state, roster composition, and role shortages.

## Current MVP

- Marketing landing page
- Responsive gaming-focused dashboard
- Demo guild: The Last Guardians
- Create/edit next event modal
- Going / Maybe / Declined RSVP states
- Live Tank / Healer / DPS composition calculation
- Clickable demo roster to simulate RSVP changes
- Officer shortage alerts
- Supabase browser/server utilities
- Multi-tenant PostgreSQL schema with RLS
- Tables for guilds, members, characters, events, RSVPs, attendance, recruitment, announcements, Discord integration, and billing
- GitHub Actions typecheck + production build workflow

## Stack

- Next.js 16
- React
- TypeScript
- Supabase Auth + PostgreSQL + RLS
- Discord OAuth / Bot APIs (next integration step)
- Stripe subscriptions (next integration step)
- Resend notifications (next integration step)
- Vercel deployment target

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The landing page and demo dashboard do not require credentials. Supabase-backed authentication and persistence do.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```

Never commit production secrets.

## Database

After creating the Supabase project, apply:

```text
supabase/migrations/001_guildos_core.sql
```

The migration enables row-level security and defines the first multi-tenant GuildOS data model.

## First production loop

1. Sign in with Discord through Supabase Auth.
2. Create a guild.
3. Connect a Discord server.
4. Invite/import members.
5. Create an event with Tank / Healer / DPS requirements.
6. Members RSVP.
7. GuildOS recalculates the roster and missing roles.
8. Discord receives event reminders.
9. Attendance is recorded after the event.

## Planned v1 modules

- Discord OAuth login
- Guild onboarding
- Persistent events / RSVPs
- Discord slash commands and RSVP buttons
- Recruitment board + public guild page
- Attendance analytics
- Announcements
- Guild permissions
- Stripe Free / Guild Pro / Guild Network plans
- Resend transactional email

## Pricing target

- Free — $0
- Guild Pro — $14.99/month
- Guild Network — $39.99/month
