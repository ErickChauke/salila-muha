# CI/CD Pipeline

Everything runs automatically. Once a PR merges to `main`, you never need to touch a
terminal. This doc explains what runs, when, and why.

---

## What triggers what

| Event | Workflow | What runs |
|-------|----------|-----------|
| PR opened/updated (backend or packages changed) | `backend.yml` CI job | typecheck, lint, test, build |
| PR opened/updated (frontend or packages changed) | `frontend.yml` CI job | typecheck, lint, test, build |
| Merge to `main` (backend or packages changed) | `backend.yml` deploy job | SSH to EC2: migrate, build, restart |
| Merge to `main` (any frontend change) | Vercel (automatic) | Next.js build and deploy |

Path filters mean a pure frontend change won't trigger the backend workflow, and vice versa.
Changes to `packages/types` trigger both since both apps depend on it.

---

## CI checks (both apps)

Runs on every PR before merge is allowed:

1. `tsc --noEmit` - TypeScript errors fail the build
2. `eslint src` - lint errors block merge
3. `vitest run` - unit tests must pass
4. `tsc` / `next build` - production build must succeed

All four must pass. If any fail, the PR cannot be merged.

---

## Backend deploy (on merge to `main`)

The `deploy` job in `backend.yml` runs only after CI passes and only on pushes to `main`
(not on PRs). It SSHes into EC2 and runs:

```bash
git fetch origin
git reset --hard origin/main   # pull latest code
git clean -fd                  # remove stale files
pnpm install --frozen-lockfile # install deps
pnpm --filter backend db:push  # apply schema changes to RDS
pnpm --filter backend build    # compile TypeScript to dist/
pm2 startOrRestart apps/backend/ecosystem.config.js --env production
```

`db:push` runs on EC2 because RDS is in the same VPC and is not reachable from GitHub
runners. Schema is always migrated before the new code starts.

---

## Frontend deploy

Vercel is connected directly to the GitHub repo. On every push to `main` it builds and
deploys automatically - no GitHub Actions step needed. Takes about 1 minute.

Environment variables are set in the Vercel dashboard, not in GitHub Secrets.

---

## GitHub Secrets required

Set in GitHub repo Settings > Secrets and variables > Actions:

| Secret | What it is |
|--------|------------|
| `EC2_HOST` | EC2 public IP or hostname |
| `EC2_USER` | SSH user (e.g. `ec2-user`) |
| `EC2_SSH_KEY` | Private key for SSH access (PEM contents) |
| `NEXT_PUBLIC_SUPABASE_URL` | Used during frontend CI build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Used during frontend CI build |
| `NEXT_PUBLIC_API_URL` | Used during frontend CI build (can be empty) |

The SSH key only needs read access to the repo and write access to the EC2 home directory.

---

## What you never need to do manually

- SSH into EC2 after a deploy
- Run `git pull` on EC2
- Run `db:push` on EC2 after a schema change
- Restart PM2
- Trigger a Vercel deploy

The only things that still require manual action:
- Updating `.env` on EC2 when adding a new environment variable (secrets can't be committed)
- First-time server setup (install pnpm, PM2, clone repo)
