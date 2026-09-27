import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GuildOS — Run your guild. Rally your team.',
  description:
    'GuildOS is the command center for gaming guilds, clans, and communities. Schedule events, build rosters, track attendance, and organize recruitment.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
