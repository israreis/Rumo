import { Fragment, type ReactNode } from "react";

/** Minimal formatting: # título, **negrito**, *itálico*, - listas. Rendered as React nodes (no HTML injection). */
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em>
      : <Fragment key={i}>{p}</Fragment>);
}

export function RichText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) out.push(<ul key={out.length} className="ml-5 list-disc space-y-0.5">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; };
  for (const line of text.split("\n")) {
    if (/^\s*[-*]\s+/.test(line)) { list.push(line.replace(/^\s*[-*]\s+/, "")); continue; }
    flush();
    if (line.startsWith("# ")) out.push(<p key={out.length} className="font-semibold">{inline(line.slice(2))}</p>);
    else if (line.trim()) out.push(<p key={out.length}>{inline(line)}</p>);
  }
  flush();
  return <div className="space-y-1.5 text-sm leading-relaxed">{out}</div>;
}
