/**
 * One page heading for every admin section.
 *
 * The pages used to each roll their own dark full-width banner with slightly
 * different copy and spacing. Inside a sidebar layout a full-bleed banner
 * fights the nav, and three variants of it looked like three products.
 */
export default function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="font-heading font-extrabold text-slate-900 text-2xl">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
