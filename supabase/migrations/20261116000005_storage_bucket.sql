-- Private bucket for covers, receipts, tickets and documents. Files live under {userId}/...
-- and are shared through long-lived signed URLs (see uploadImage in src/lib/trips-api.ts).
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;
