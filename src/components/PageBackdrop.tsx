/**
 * Fundo das telas do app: hachuras finas de papel-moeda, bem suaves, e uma rosa dos ventos
 * apagada no canto inferior direito. Fica fixo atrás de tudo, não entra nos cartões e some na impressão.
 */
export function PageBackdrop() {
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-100 dark:opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(32deg, transparent 0 7px, color-mix(in oklab, var(--caramelo) 9%, transparent) 7px 8px)," +
            "linear-gradient(118deg, transparent 0 30%, color-mix(in oklab, var(--latao) 6%, transparent) 30% 46%, transparent 46% 70%, color-mix(in oklab, var(--latao) 5%, transparent) 70% 80%, transparent 80%)",
        }}
      />
      <svg viewBox="0 0 200 200" className="absolute -bottom-24 -right-24 size-[34rem] text-tinta opacity-[0.06] dark:opacity-[0.08]">
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 2.5" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="0.5" />
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i * Math.PI) / 36, r1 = 88, r2 = i % 6 === 0 ? 80 : 84;
          return <line key={i} x1={100 + Math.cos(a) * r1} y1={100 + Math.sin(a) * r1} x2={100 + Math.cos(a) * r2} y2={100 + Math.sin(a) * r2} stroke="currentColor" strokeWidth="0.5" />;
        })}
        <path d="M100 20 L108 100 L100 180 L92 100 Z M20 100 L100 92 L180 100 L100 108 Z" fill="currentColor" />
        <path d="M100 52 L104 100 L100 148 L96 100 Z M52 100 L100 96 L148 100 L100 104 Z" fill="currentColor" transform="rotate(45 100 100)" />
      </svg>
    </div>
  );
}
