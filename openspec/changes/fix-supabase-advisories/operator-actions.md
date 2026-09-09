# Operator Actions — Supabase Dashboard / Platform

These three advisories cannot be resolved by SQL migration. They must be applied
by an operator with dashboard/platform access. Perform them after the migrations
in this change are merged.

## 5.1 Email OTP expiry < 1 hour (`auth_otp_long_expiry`)

- **Where:** Supabase Dashboard → Authentication → Providers → Email → "Email OTP Expiration".
- **Action:** Set the OTP expiry to a value under one hour (e.g. 3600 seconds or less; 1800s recommended).
- **Reference:** https://supabase.com/docs/guides/platform/going-into-prod#security
- **Verify:** Re-run the security advisors; `auth_otp_long_expiry` should report 0 findings.

## 5.2 Enable leaked-password protection (`auth_leaked_password_protection`)

- **Where:** Supabase Dashboard → Authentication → Providers → Email → "Leaked Password Protection" (HaveIBeenPwned).
- **Action:** Enable the toggle so compromised passwords are rejected via HaveIBeenPwned.org.
- **Reference:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- **Verify:** Re-run the security advisors; `auth_leaked_password_protection` should report 0 findings.

## 5.3 Upgrade Postgres (`vulnerable_postgres_version`)

- **Current version:** `supabase-postgres-15.8.1.114` (has outstanding security patches).
- **Where:** Supabase Dashboard → Settings → Infrastructure → Postgres version → "Upgrade".
- **Action:** Schedule and apply the Postgres upgrade to pick up available security patches.
- **Downtime:** The upgrade involves a brief maintenance window; schedule during low-traffic hours.
- **Reference:** https://supabase.com/docs/guides/platform/upgrading
- **Verify:** Re-run the security advisors; `vulnerable_postgres_version` should report 0 findings.
