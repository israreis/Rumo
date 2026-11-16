<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Travel app rules
- Trip access is decided by `trip_members` (owner/editor/viewer) via security-definer helpers `can_view_trip`/`can_edit_trip`; child tables check those, never owner_id directly — keeps sharing a data-only change.
- Trip data is read/written from the browser client under RLS (`src/lib/trips-api.ts`); signed-in pages live under `src/routes/_authenticated/` (ssr: false).
- Uploaded images go to the private `media` bucket under `{userId}/...` and are stored as long-lived signed URLs — workspace blocks public buckets.
- New users get the sample trip (Lisboa e Porto) from the `handle_new_user` signup trigger, not from app code.
- Trip status is derived from dates in `computeStatus` unless `status_override` is set.
- Transport instants are stored as UTC timestamps plus the IANA zone of each end; UI converts with `src/lib/tz.ts` so times show in the local city zone.
- Itinerary is derived client-side (`src/lib/itinerary.ts`): transports/check-ins are read-only auto items; only activities and itinerary_events are draggable and persist `position` + date/day.
- Places are geocoded on save via OpenStreetMap Nominatim into lat/lng columns; the Leaflet map is lazy-loaded.
- Every money row stores original amount+currency, `fx_rate` (Frankfurter, fetched once then frozen) and `converted_amount` in trip currency via `withFx`; card fees (IOF+spread) are frozen in `expenses.fees_pct`.
- Budget lines are derived in `useBudget` from transports/lodgings/activities/events plus `budget_items`; pure money rules (installments, splits, settlement, daily allowance) live in `src/lib/budget.ts`.
- Overview alerts and Documents/Checklist rules (passport 6-month check, free-cancel 3-day warning, Dia X de Y, progress) live as pure functions in `src/lib/trip-extras.ts`; checklist templates are code constants copied into rows on apply, so applied items are freely editable.
