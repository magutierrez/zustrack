export function MudInfoRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-muted-foreground text-[10px] font-bold uppercase">{label}</span>
          <span className="text-foreground font-mono text-[11px] font-semibold">{value}</span>
        </div>
        <p className="text-muted-foreground text-[10px] leading-relaxed">{detail}</p>
      </div>
    </li>
  );
}
