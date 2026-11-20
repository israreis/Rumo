import { useQuery } from "@tanstack/react-query";
import { useOfflineFiles } from "@/lib/offline-files";
import { planQuery, type Activity, type Lodging, type Transport } from "@/lib/plan-api";
import type { TravelerDoc } from "./DocumentsTab";

/**
 * Ao abrir a viagem (com internet), guarda no aparelho documentos, passagens, reservas e
 * ingressos anexados, para estarem à mão na chegada mesmo sem conexão. Não desenha nada.
 */
export function OfflineFilesKeeper({ tripId }: { tripId: string }) {
  const { data: docs = [] } = useQuery(planQuery<TravelerDoc>("traveler_documents", tripId));
  const { data: transports = [] } = useQuery(planQuery<Transport>("transports", tripId));
  const { data: lodgings = [] } = useQuery(planQuery<Lodging>("lodgings", tripId));
  const { data: activities = [] } = useQuery(planQuery<Activity>("activities", tripId));
  useOfflineFiles([...docs, ...transports, ...lodgings, ...activities].map((r) => r.attachment_url));
  return null;
}
