# Development Workflow

## Branching Strategy

- `main` is the production branch - never push directly to it
- Create feature branches for all changes
- Merge via pull requests only

## Writing Style

- **No em dashes** (`—`) anywhere in the codebase — UI text, comments, docs, or strings. Use a regular dash (`-`) instead. Em dashes are a known marker of AI-generated text.

## PR Guidelines

Keep PRs small and focused:

- **~2 files changed** per PR
- **~3 commits** per PR
- **< 50 lines changed** per commit
- **Commit messages**: short, simple, no AI attribution
  - Good: `add deposit preset buttons`, `fix wallet rounding`
  - Bad: `Updated wallet component to add new deposit preset button functionality`

Small PRs are easier to review, less likely to break things, and faster to merge.

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/description` | `feat/add-deposit-history` |
| Bug fix | `fix/description` | `fix/wallet-balance-rounding` |
| Refactor | `refactor/description` | `refactor/strategy-service` |
| Chore | `chore/description` | `chore/update-dependencies` |

## Step-by-Step Workflow

### 1. Start a new task

```bash
git checkout main
git pull origin main
git checkout -b feat/my-feature
```

### 2. Work on your changes

Make changes, commit as you go with short messages:

```bash
git add <files>
git commit -m "add deposit preset buttons"
```

### 3. Push and open a PR

```bash
git push -u origin feat/my-feature
gh pr create --title "add deposit preset buttons"
```

Or open the PR from GitHub's web UI.

### 4. CI runs automatically

Two checks run on every PR:

- **Backend checks** - type check, ESLint, Vitest tests, build
- **Frontend checks** - type check, next lint, Vitest tests, build

Both must pass before you can merge.

### 5. Merge the PR

- Go to the PR on GitHub
- Click **Squash and merge** (keeps history clean)
- Delete the remote branch when prompted

### 6. Auto-deploy happens

After merge to `master`:

- **Frontend** - Vercel auto-deploys (takes ~1 minute)
- **Backend** - GitHub Actions SSHs into EC2, pulls, builds, and restarts PM2 (takes ~2 minutes)

### 7. Clean up locally

```bash
git checkout main
git pull origin main
git branch -d feat/my-feature
```

## Running Tests Locally

```bash
# Backend
cd backend
npm test              # run once
npm run test:watch    # watch mode

# Frontend
cd frontend
npm test              # run once
npm run test:watch    # watch mode
```

## Running Lint Locally

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

## What Happens When CI Fails

1. Check the **Actions** tab on GitHub to see which step failed
2. Fix the issue locally
3. Commit and push - CI re-runs automatically on the same PR

Common failures:
- **Type check** (`tsc --noEmit`) - fix TypeScript errors
- **Lint** - fix ESLint errors (warnings are OK)
- **Tests** - fix failing tests
- **Build** - fix compilation errors

## Emergency: Bypass CI

As repo admin, you can merge even if CI fails. Only do this for critical hotfixes.

## Useful Commands

```bash
# Check current branch
git branch

# See all branches
git branch -a

# Create PR from terminal
gh pr create --title "my change"

# Check PR status
gh pr status

# View CI run
gh run list
```
