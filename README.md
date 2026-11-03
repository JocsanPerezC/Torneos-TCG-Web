<div align="center">

<img src="public/edh-tournaments-icon.svg" alt="EDH Tournaments logo" width="96" height="96" />

# EDH Tournaments

**Run multiplayer Commander tournaments without the spreadsheet.**

Pairings, pods, results and live standings in one place, with a public page anyone can follow.

[Live app](https://edh-tournaments.vercel.app) · [Try it without an account](https://edh-tournaments.vercel.app/trial) · [Setup](docs/setup.md)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<br />

<img src="docs/images/landing.webp" alt="EDH Tournaments landing page" width="880" />

</div>

---

## Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Roles](#roles)
- [Run it locally](#run-it-locally)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)

## Features

Built for **multiplayer Commander (EDH)**: casual, cEDH or your group's house rules, in pods of 3 to 5. Already used by several game stores in Costa Rica.

### 🏆 For organizers

- **Tournaments** with name, format, number of rounds, player and table limits, and public visibility.
- **Players** can be added manually (no account needed) or join with their own `player` account. Search, rename, retire or remove them before they play.
- **Invitations** through a revocable link, a QR code or a short manual code.
- **Pods of 3 to 5 players.** Pairing avoids repeat opponents first, then groups players with similar scores.
- **Round control**: draft, start, timer, manual table adjustments and removal of the last round.
- **Results per table**: manual points, kills and outcome (win, loss or draw) for each player, plus the time the table finished (recorded automatically, editable). A round only closes once every table has valid results.
- **Live standings**, ranked by points, then wins, draws, fewer losses, win rate, kills and the average points of the opponents faced. Players tied on everything share the place. An info button explains the order, and an informational "average win time" column shows how fast each player wins.
- **Battle log** with the player of the tournament, records with clear owners (hunter, unstoppable, fastest win, best round…), tables of the night, and records still up for grabs.
- **Automatic closing**: a tournament finishes by itself 24 hours after its last planned round, or after 30 days without activity.

### 🎴 For players

- An account with a **private name and a public nickname**, which is what tournaments show.
- Join with an invitation link (`/unirse/:token`), the manual code or a QR.
- **My decks** (`/mazos`): save your Moxfield or Archidekt deck links with their commander, searched on Scryfall. Optionally pick the deck you play in each tournament, until the first round starts; its commander shows next to your name in the standings.
- **My statistics** (`/estadisticas`): win rate, recent form, best result, win time and per-tournament history.
- **Life counter** (`/contador`) for 2 to 6 players, with dice, coin flip and a "who goes first" roulette.

### 🌐 For everyone

- **Public read-only page** at `/t/:slug` with standings, current round, tables, table times and the timer.
- **Trial mode** at `/trial`, no account required.
- Email and password or Google sign-in with per-field validation, password recovery, profile photo, password change and self-service account deletion.
- **Spanish and English** interface.

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/images/rounds.webp" alt="A round in progress, with tables, results and the round timer" /></td>
    <td width="50%"><img src="docs/images/standings.webp" alt="Live standings with the podium and full ranking table" /></td>
  </tr>
  <tr>
    <td align="center"><b>Rounds</b>: pods, results and the round timer</td>
    <td align="center"><b>Standings</b>: podium and full ranking, updated live</td>
  </tr>
</table>

## Roles

| Role          | Can                                                                                     |
| ------------- | --------------------------------------------------------------------------------------- |
| `player`      | Join tournaments, choose a deck, and see their own history and statistics.              |
| `organizer`   | Create and manage their own tournaments.                                                |
| `admin`       | Browse all data from `/admin`. Cannot create tournaments.                               |
| `super_admin` | Everything `admin` can do, plus manage any tournament, manage users and change roles.   |

New accounts pick `player` or `organizer` on first sign-in. Accounts that arrive through an invitation become `player` automatically. After that, only a `super_admin` can change the role. Permissions are enforced in Supabase (RLS, triggers and functions), not just in the UI.

## Run it locally

```bash
npm install
npm run dev
```

Without Supabase configured, the app runs in demo mode using `localStorage`. For accounts, the database, the Edge Function and deployment, see **[docs/setup.md](docs/setup.md)**.

## Project structure

```text
src/
├── app/          Bootstrapping, routes (AppRouter.tsx) and form limits
├── features/     One folder per screen or area (tournaments, player, admin, landing…)
├── components/   Shared pieces: ui/, layout/ and feedback/
├── domain/       Pure logic: tables, pairing, scoring, statistics, timing and their tests
├── state/        Auth and tournament contexts
├── data/         Supabase repositories
├── lib/          Supabase client, form validation, Scryfall search and utilities
├── i18n/         Spanish (es.ts) and English (en.ts) strings
└── styles/       Layered CSS, imported in order from index.css
supabase/         Migrations, the admin-users Edge Function and config
docs/             Architecture, design system, decisions, backlog and screenshots
public/           Images, robots.txt and sitemap
```

Imports use the `@/` alias, for example `@/components/ui/button`.

## Documentation

Setup is in English; the rest of the project docs are in Spanish.

| Document                                             | What's inside                                 |
| ---------------------------------------------------- | --------------------------------------------- |
| [docs/setup.md](docs/setup.md)                       | Local setup, Supabase and deployment.         |
| [docs/architecture.md](docs/architecture.md)         | Layers, flows and sources of truth.           |
| [docs/design-system.md](docs/design-system.md)       | Colors, tokens and visual guidelines.         |
| [docs/decisions/](docs/decisions/)                   | Architecture decision records.                |
| [docs/auditoria-visual.md](docs/auditoria-visual.md) | Visual normalization: done and pending.       |
| [docs/pendientes.md](docs/pendientes.md)             | Product backlog.                              |
| [AGENTS.md](AGENTS.md)                               | Rules for coding agents.                      |

## License

[MIT](LICENSE) © 2026 Jocsan Perez C
