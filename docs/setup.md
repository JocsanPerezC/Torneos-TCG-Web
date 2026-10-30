# Setup

How to run EDH Tournaments locally, connect it to Supabase and deploy it.

## Requirements

- **Node.js 20.19+ or 22.12+** (Vite's minimum).
- A [Supabase](https://supabase.com) project, only if you want real accounts and persistence.

## Run locally

```bash
npm install
cp .env.example .env.local   # on Windows: copy .env.example .env.local
npm run dev
```

> [!TIP]
> Leave the Supabase variables empty and the app starts in **demo mode**: everything is stored in `localStorage` and a sample tournament is included.

### Environment variables

Listed in [.env.example](../.env.example). They are all public and end up in the browser bundle:

| Variable                 | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL.                      |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key.                           |
| `VITE_PUBLIC_APP_URL`    | Base URL used in invitation links and QR codes. |

> [!CAUTION]
> Never put the `service_role` key in the frontend or in `.env.local`.

### Testing invitations on a phone

`localhost` only exists on your computer. To scan a QR code from a phone on the same Wi-Fi, set `VITE_PUBLIC_APP_URL` to the `Network` address Vite prints (for example `http://192.168.1.20:5173`) and restart `npm run dev`.

## Scripts

| Command               | What it does                                |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | Start the development server.               |
| `npm run build`       | Type-check and build into `dist/`.          |
| `npm run lint`        | Lint with oxlint.                           |
| `npm test`            | Run the domain logic tests with Vitest.     |
| `npm run format`      | Format with Prettier.                       |
| `npm run preview:lan` | Serve `dist/` on your local network (5173). |

During development, `/muestrario` shows every UI component and state. It only responds on `localhost`.

## Supabase

1. Create a project and fill in `.env.local`.
2. Link the project and apply the migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

3. Under **Authentication**, add your environment's redirect URLs (account confirmation, password recovery and Google).
4. Deploy the user management Edge Function:

   ```bash
   npx supabase functions deploy admin-users --no-verify-jwt
   ```

   It only uses the admin API after verifying the caller's role. Supabase provides the `service_role` key to the function securely at runtime.

5. Promote your first `super_admin` from the SQL Editor, using the UUID from **Authentication > Users**:

   ```sql
   update public.profiles
   set role = 'super_admin'
   where id = 'USER-UUID';
   ```

`supabase/migrations/` starts from six themed files (schema, accounts and roles, tournaments, invitations, profile, and security) that consolidate the earlier history. See [ADR 0004](decisions/0004-consolidacion-de-migraciones.md). Migrations are immutable once applied: every change goes in a new, dated migration.

## Deployment

Built for Vercel. Set the three `VITE_` variables in your project and publish `dist/`. [vercel.json](../vercel.json) rewrites every route to `index.html` so client-side routing works. Vercel Web Analytics turns on automatically when deployed.
