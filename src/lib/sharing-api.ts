import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TripRole } from "@/components/plan/access";

export type Member = { user_id: string; role: TripRole; full_name: string | null; email: string | null; avatar_url: string | null };
export type Invite = { id: string; email: string; role: TripRole; token: string; accepted_at: string | null; created_at: string };

export const ROLE_LABEL: Record<TripRole, string> = { owner: "Dono", editor: "Pode editar", viewer: "Só visualizar" };

/** Role of the signed-in user on a trip (owner also when owner_id matches). */
export const myRoleQuery = (tripId: string, ownerId: string | undefined) =>
  queryOptions({
    queryKey: ["trip-role", tripId],
    queryFn: async (): Promise<TripRole> => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return "viewer";
      if (ownerId && ownerId === uid) return "owner";
      const { data } = await supabase.from("trip_members").select("role").eq("trip_id", tripId).eq("user_id", uid).maybeSingle();
      return (data?.role as TripRole | undefined) ?? "viewer";
    },
    staleTime: 60_000,
  });

export const membersQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip-members", tripId],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase.rpc("get_trip_members", { _trip: tripId });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

export const invitesQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip-invites", tripId],
    queryFn: async (): Promise<Invite[]> => {
      const { data, error } = await supabase
        .from("trip_invites")
        .select("id, email, role, token, accepted_at, created_at")
        .eq("trip_id", tripId)
        .is("accepted_at", null)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Invite[];
    },
  });

export async function createInvite(tripId: string, email: string, role: Exclude<TripRole, "owner">): Promise<Invite> {
  const clean = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("trip_invites")
    .upsert({ trip_id: tripId, email: clean, role, accepted_at: null }, { onConflict: "trip_id,email" })
    .select("id, email, role, token, accepted_at, created_at")
    .single();
  if (error) throw error;
  return data as Invite;
}

export async function deleteInvite(id: string) {
  const { error } = await supabase.from("trip_invites").delete().eq("id", id);
  if (error) throw error;
}

export async function setMemberRole(tripId: string, userId: string, role: Exclude<TripRole, "owner">) {
  const { error } = await supabase.from("trip_members").update({ role }).eq("trip_id", tripId).eq("user_id", userId);
  if (error) throw error;
}

export async function removeMember(tripId: string, userId: string) {
  const { error } = await supabase.from("trip_members").delete().eq("trip_id", tripId).eq("user_id", userId);
  if (error) throw error;
}

export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("accept_trip_invite", { _token: token });
  if (error) throw error;
  return data as string;
}

/** Accepts invites sent to the signed-in e-mail; returns how many were accepted. */
export async function acceptPendingInvites(): Promise<number> {
  const { data, error } = await supabase.rpc("accept_pending_invites");
  if (error) return 0;
  return Number(data ?? 0);
}

export function inviteLink(token: string) {
  return `${window.location.origin}/convite/${token}`;
}

export function publicLink(token: string) {
  return `${window.location.origin}/r/${token}`;
}

export async function setPublicLink(tripId: string, enabled: boolean): Promise<string | null> {
  const token = enabled ? crypto.randomUUID() : null;
  const { error } = await supabase.from("trips").update({ public_token: token }).eq("id", tripId);
  if (error) throw error;
  return token;
}

/** Shares through the OS sheet when available (phones), else copies to the clipboard. */
export async function shareOrCopy(url: string, title: string, text: string): Promise<"shared" | "copied"> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ url, title, text });
      return "shared";
    } catch {
      /* cancelled or unsupported: fall back to copy */
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
