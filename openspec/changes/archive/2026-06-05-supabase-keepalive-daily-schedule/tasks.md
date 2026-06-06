## 1. Update Workflow Schedule

- [x] 1.1 In `.github/workflows/supabase-keepalive.yml`, change the cron from `0 12 * * 1,4` to `0 12 * * *`
- [x] 1.2 Update the inline comment to reflect "Daily at 12:00 UTC"

## 2. Verify

- [x] 2.1 Confirm the workflow YAML is valid and the `workflow_dispatch` trigger is unchanged
- [ ] 2.2 Trigger the workflow manually via the GitHub Actions UI and confirm the ping step returns 2xx
- [ ] 2.3 After merge, confirm the next scheduled run appears as daily in the Actions tab
