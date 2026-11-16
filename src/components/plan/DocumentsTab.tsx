import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, Phone, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { planQuery } from "@/lib/plan-api";
import { CONTACT_KINDS, DOC_KINDS, passportTooShort } from "@/lib/trip-extras";
import { PassportMark } from "@/components/Logo";
import { formatDate } from "@/lib/trip-utils";
import type { Trip } from "@/lib/trips-api";
import type { Database } from "@/integrations/supabase/types";
import { AreaF, AttachmentF, EditDialog, Pill, SelectF, TextF, useEditor } from "./common";
import { FileViewer } from "./FileViewer";

export type TravelerDoc = Database["public"]["Tables"]["traveler_documents"]["Row"];
export type Contact = Database["public"]["Tables"]["emergency_contacts"]["Row"];

export function DocumentsTab({ trip }: { trip: Trip }) {
  const { data: docs = [] } = useQuery(planQuery<TravelerDoc>("traveler_documents", trip.id));
  const { data: contacts = [] } = useQuery(planQuery<Contact>("emergency_contacts", trip.id));
  const de = useEditor(), ce = useEditor();
  const travelers = trip.trip_travelers;
  const tOpts = Object.fromEntries(travelers.map((t) => [t.id!, t.name]));

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-3 text-2xl font-semibold"><PassportMark className="size-10" /> Documentos</h2>
          <Button onClick={() => de.open({ kind: "passport", traveler_id: travelers[0]?.id ?? null })} disabled={!travelers.length}><Plus /> Documento</Button>
        </div>
        {!travelers.length ? (
          <EmptyState icon={FileText} title="Cadastre os viajantes" text="Edite a viagem e adicione os viajantes para guardar passaportes, vistos e seguros de cada um." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {travelers.map((t) => {
              const mine = docs.filter((d) => d.traveler_id === t.id);
              return (
                <div key={t.id} className="rounded-2xl border bg-card p-5 shadow-card">
                  <h3 className="font-semibold">{t.name}</h3>
                  {!mine.length && <p className="mt-2 text-sm text-muted-foreground">Nenhum documento ainda. Comece pelo passaporte.</p>}
                  <ul className="mt-3 space-y-3">
                    {mine.map((d) => {
                      const warn = d.kind === "passport" && passportTooShort(d.expires_at, trip.end_date);
                      return (
                        <li key={d.id} onClick={() => de.open(d)} className="cursor-pointer rounded-xl border p-3 hover:bg-muted/50">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{DOC_KINDS[d.kind]}</span>
                            {d.number && <span className="text-sm text-muted-foreground">nº {d.number}</span>}
                            {warn && <Pill tone="destructive"><AlertTriangle className="size-3" /> Vence a menos de 6 meses da volta</Pill>}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {[d.issuer, d.expires_at && `validade ${formatDate(d.expires_at)}`].filter(Boolean).join(" · ")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {d.phone && <Button asChild size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}><a href={`tel:${d.phone}`}><Phone /> Emergência {d.phone}</a></Button>}
                            <FileViewer url={d.attachment_url} title={`${DOC_KINDS[d.kind]} · ${t.name}`} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold">Contatos de emergência</h2>
          <Button variant="outline" onClick={() => ce.open({ kind: "embassy" })}><Plus /> Contato</Button>
        </div>
        {!contacts.length ? (
          <EmptyState icon={ShieldAlert} title="Nenhum contato de emergência" text="Adicione o consulado brasileiro, a seguradora, o banco do cartão e alguém de confiança." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((c) => (
              <div key={c.id} onClick={() => ce.open(c)} className="cursor-pointer rounded-2xl border bg-card p-4 shadow-card hover:bg-muted/40">
                <Pill tone="primary">{CONTACT_KINDS[c.kind]}</Pill>
                <p className="mt-2 font-medium">{c.name}</p>
                {c.notes && <p className="text-sm text-muted-foreground">{c.notes}</p>}
                {c.phone && <Button asChild size="sm" className="mt-3" onClick={(e) => e.stopPropagation()}><a href={`tel:${c.phone}`}><Phone /> Ligar · {c.phone}</a></Button>}
              </div>
            ))}
          </div>
        )}
      </section>

      {de.editing && (
        <EditDialog table="traveler_documents" tripId={trip.id} open onOpenChange={de.close} title={de.editing.id ? "Editar documento" : "Novo documento"} initial={de.editing}>
          {(f, set) => <>
            <SelectF f={f} set={set} k="traveler_id" label="Viajante" options={tOpts} />
            <SelectF f={f} set={set} k="kind" label="Tipo" options={DOC_KINDS} />
            <TextF f={f} set={set} k="number" label={f.kind === "insurance" ? "Nº da apólice" : "Número"} />
            <TextF f={f} set={set} k="expires_at" label="Validade" type="date" />
            {(f.kind === "insurance" || f.kind === "visa") && <TextF f={f} set={set} k="issuer" label={f.kind === "insurance" ? "Seguradora" : "País/emissor"} />}
            {f.kind === "insurance" && <TextF f={f} set={set} k="phone" label="Telefone de emergência" type="tel" />}
            <AttachmentF f={f} set={set} label="Arquivo (PDF ou imagem)" />
            <AreaF f={f} set={set} k="notes" label="Observações" className="sm:col-span-2" />
          </>}
        </EditDialog>
      )}
      {ce.editing && (
        <EditDialog table="emergency_contacts" tripId={trip.id} open onOpenChange={ce.close} title={ce.editing.id ? "Editar contato" : "Novo contato"} initial={ce.editing}>
          {(f, set) => <>
            <SelectF f={f} set={set} k="kind" label="Tipo" options={CONTACT_KINDS} />
            <TextF f={f} set={set} k="name" label="Nome" />
            <TextF f={f} set={set} k="phone" label="Telefone" type="tel" placeholder="+351 ..." />
            <AreaF f={f} set={set} k="notes" label="Observações (endereço, horário)" className="sm:col-span-2" />
          </>}
        </EditDialog>
      )}
    </div>
  );
}
