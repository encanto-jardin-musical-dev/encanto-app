## Context

The `ActionButton` component (`src/components/common/ActionButton.tsx`) defines its staff actions in a module-level `STAFF_ACTIONS` array where each item carries a literal English `label` (`"Attendance"`, `"Daily Report"`, `"Tasks"`, `"Messages"`, `"Admin Options"`). These literals are rendered directly in the menu, and the trigger uses `aria-label="actions"`. Meanwhile, the rest of the app localizes text through `next-intl`: client components call `useTranslations("<Namespace>")` and read keys from `messages/es.json`, with the locale fixed to `es` in `src/i18n/request.ts`.

The placeholder screens for the new staff actions (Attendance, Daily Report, Tasks, Admin Options) likewise display hardcoded English screen names today.

This is a localization-consistency fix, not a behavioral change. The feature flag gating, role logic, routing, and HeroUI/Heroicons usage all stay the same.

## Goals / Non-Goals

**Goals:**
- Source every user-facing string in `ActionButton` (action labels + accessible label) from the i18n catalog.
- Localize the placeholder screen names from the same catalog so menu labels and screen titles stay in sync.
- Keep a single source of truth for each label, keyed by the action's existing stable `key`.
- Preserve all current behavior, roles, routes, icons, and the feature flag.

**Non-Goals:**
- Adding new locales or a locale switcher (locale remains fixed to `es`).
- Changing routing, role gating, the feature flag, or the fallback-to-messages behavior.
- Redesigning the menu or its components.
- Translating any strings outside the plus button / placeholder screens.

## Decisions

### Key labels by stable `key`, drop literal `label` from config
The `STAFF_ACTIONS` array already has a stable `key` per action (`attendance`, `daily-report`, `tasks`, `messages`, `admin-options`). We remove the `label` field from the config type and resolve the display string at render time via `t(key)` against an `ActionButton` namespace. The `aria-label` for each menu item also uses the same translated value.

- **Why over keeping `label` in config:** Avoids two parallel sources of text (one literal, one translated) and prevents drift. The `key` is already the natural i18n key.
- **Alternative considered:** Keep `label` as a fallback and overlay translations — rejected as redundant; the catalog is the single source of truth and the app already assumes `es` messages are always present.

### New `ActionButton` namespace in `messages/es.json`
Add a top-level `ActionButton` object mirroring the app's existing namespace convention (e.g., `NavigationBar`, `MessagesInput`). It contains the trigger's accessible label plus one entry per action key.

Proposed shape:
```json
"ActionButton": {
  "triggerLabel": "Acciones",
  "actions": {
    "attendance": "Asistencia",
    "daily-report": "Reporte diario",
    "tasks": "Tareas",
    "messages": "Mensajes",
    "admin-options": "Opciones de administrador"
  }
}
```
- **Why a nested `actions` object:** Lets the component do `t(\`actions.${key}\`)` cleanly and keeps the trigger label separate from per-action labels.
- **Spanish wording:** Chosen to match existing catalog tone (e.g., `FeedFilters.tasks` already uses "Tareas"). Reuse "Mensajes"/"Tareas" wording for consistency.

### Placeholder screens read from the same namespace
Each placeholder screen renders its name via `useTranslations("ActionButton")` and the matching `actions.<key>` entry, so the screen title and the menu label always match.

- **Why:** Single source of truth; updating one Spanish string updates both menu and screen.

## Risks / Trade-offs

- **Missing translation key produces a visible error/blank label** → Add all five action keys plus `triggerLabel` in the same change; verify by rendering the menu for a teacher and an admin. `next-intl` surfaces missing keys loudly, which makes omissions easy to catch during review.
- **Key/route mismatch if a new action is added later** → The `key` remains the contract between config, i18n, and routing; document that new actions must add a matching `actions.<key>` entry. Covered in tasks.
- **Spanish copy wording choices** → Low risk; wording mirrors existing catalog entries and can be adjusted later without code changes since it lives in `messages/es.json`.
