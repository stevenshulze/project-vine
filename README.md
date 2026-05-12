# Project Vine

Performance-based recruitment marketplace. Employers post jobs with referral fees. Affiliates share tracked links and earn commissions — paid only when a hire is made.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| File storage | Supabase Storage |
| Payments | Stripe Connect (wired up via env vars) |

---

## Quick start

### 1. Install dependencies

```bash
cd project-vine
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon public key** (Settings → API)

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the values. All `NEXT_PUBLIC_*` vars are safe to expose to the browser; keep `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` server-side only.

### 4. Run the database migration

**Option A — Supabase dashboard SQL editor**

Copy the contents of `supabase/migrations/0001_initial.sql` and run it in the SQL editor.

**Option B — Supabase CLI**

```bash
npm install -g supabase
supabase link --project-ref <your-project-ref>
supabase db push
```

### 5. Create the resumes storage bucket

In the Supabase dashboard → Storage → New bucket:
- Name: `resumes`
- Public: **off** (private, served via signed URLs or RLS)

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## User roles

| Role | Default landing | Description |
|---|---|---|
| `employer` | `/employer` | Post jobs, review applications, approve commissions |
| `affiliate` | `/affiliate` | Generate referral links, track clicks and earnings |
| `admin` | `/admin` | Full access — disputes, payouts, audit log |

Role is set at registration via `user_metadata.role` and synced to `public.users` by a Postgres trigger.

---

## Key routes

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/(auth)/login/page.tsx` | Email/password sign-in |
| `/register` | `app/(auth)/register/page.tsx` | Sign-up with role selector |
| `/auth/callback` | `app/auth/callback/route.ts` | Supabase email-confirm callback |
| `/employer` | `app/employer/page.tsx` | Employer dashboard (coming soon) |
| `/affiliate` | `app/affiliate/page.tsx` | Affiliate dashboard (coming soon) |
| `/admin` | `app/admin/page.tsx` | Admin dashboard (coming soon) |
| `/jobs/[job_id]` | `app/jobs/[job_id]/page.tsx` | Public job listing + application form |
| `/r/[token]` | `app/r/[token]/route.ts` | Tracked referral link redirect |

---

## How referrals work

```
Affiliate generates link  →  /r/<uuid-token>
                                    ↓
                          click_events row logged
                          vine_ref cookie set (30 days)
                                    ↓
                          Redirect to /jobs/<job_id>
                                    ↓
                     Candidate fills application form
                                    ↓
               Application row created  +  Commission row (status: pending)
                                    ↓
                    Employer marks candidate as hired
                                    ↓
                     Commission → pending_verification
                                    ↓
                        Verification period passes
                                    ↓
                       Commission → approved → paid
                       Payout triggered via Stripe Connect
```

### Self-referral detection

If the applying candidate's email matches the affiliate's registered email, `applications.is_self_referral` is set to `true` and the commission type is recorded as `self_referral`. Business logic for how to treat self-referrals (reduced rate, rejected, flagged) is left to the commission approval flow.

---

## Project structure

```
app/
├── (auth)/
│   ├── login/page.tsx          # Sign-in form
│   └── register/page.tsx       # Sign-up form with role picker
├── auth/callback/route.ts      # Supabase email-confirm redirect
├── employer/page.tsx           # Employer dashboard (stub)
├── affiliate/page.tsx          # Affiliate dashboard (stub)
├── admin/page.tsx              # Admin dashboard (stub)
├── jobs/[job_id]/
│   ├── page.tsx                # Job detail (server component)
│   ├── apply-form.tsx          # Application form (client component)
│   └── actions.ts              # Server action: submit application
├── r/[token]/route.ts          # Referral redirect + click logging
├── layout.tsx                  # Root layout
├── page.tsx                    # Landing page
└── globals.css
lib/
├── supabase/
│   ├── client.ts               # Browser Supabase client
│   └── server.ts               # Server Supabase client (cookies)
└── types/
    └── database.ts             # TypeScript types for every table
middleware.ts                   # Auth guard + role-based redirects
supabase/
└── migrations/
    └── 0001_initial.sql        # Full schema + RLS policies + trigger
```

---

## Next steps

- [ ] Employer: job creation & management UI
- [ ] Affiliate: referral link generator with copy-to-clipboard
- [ ] Employer: application review queue (applied → reviewing → hired/rejected)
- [ ] Commission state machine (hired triggers pending_verification)
- [ ] Stripe Connect onboarding for affiliates
- [ ] Admin payout dashboard
- [ ] Dispute workflow
- [ ] Email notifications (Resend or Supabase Edge Functions)
