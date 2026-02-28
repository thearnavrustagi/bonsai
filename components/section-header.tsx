import { type ReactNode } from "react";

interface SectionHeaderProps {
  label: string;
  icon?: ReactNode;
  rightContent?: ReactNode;
  accentColor?: "gold" | "purple";
}

export function SectionHeader({
  label,
  icon,
  rightContent,
  accentColor = "gold",
}: SectionHeaderProps) {
  const barColor =
    accentColor === "purple" ? "bg-simon-purple" : "bg-gold";

  const textColor =
    accentColor === "purple"
      ? "text-simon-purple-light"
      : "text-gold";

  const ruleColor =
    accentColor === "purple"
      ? "bg-simon-purple/25"
      : "bg-gold/25";

  return (
    <div className="mb-5">
      {/* Top rule */}
      <div className={`h-[2px] ${ruleColor}`} />

      <div className="flex items-center justify-between gap-4 py-3 px-1">
        <div className="flex items-center gap-3">
          {/* Accent bar */}
          <div className={`w-[3px] h-4 rounded-full ${barColor}`} />

          {icon && <span className={textColor}>{icon}</span>}

          <h2 className={`section-label ${textColor}`}>
            {label}
          </h2>
        </div>

        {rightContent && (
          <div className="flex items-center gap-3">{rightContent}</div>
        )}
      </div>

      <div className={`h-[1px] ${ruleColor}`} />
    </div>
  );
}
