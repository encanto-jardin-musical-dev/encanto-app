## 1. Create GitHub Action workflow

- [x] 1.1 Create `.github/workflows/supabase-keepalive.yml` with cron schedule (`0 12 * * 1,4`) and `workflow_dispatch` trigger
- [x] 1.2 Add `ping` job that curls `${{ vars.SUPABASE_URL }}/rest/v1/profiles?select=id&limit=1` with `apikey` and `Authorization: Bearer` headers from `secrets.SUPABASE_PUBLISHABLE_KEY`
- [x] 1.3 Use `curl -f` flag so the step fails on non-2xx responses

## 2. Configure GitHub repository secrets and variables

- [x] 2.1 Add `SUPABASE_PUBLISHABLE_KEY` secret in GitHub repo settings → Secrets and variables → Actions
- [x] 2.2 Add `SUPABASE_URL` variable in GitHub repo settings → Secrets and variables → Actions → Variables

## 3. Verify

- [ ] 3.1 Trigger the workflow manually via `workflow_dispatch` and confirm the run passes
