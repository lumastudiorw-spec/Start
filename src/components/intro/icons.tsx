import { COLORS } from "./palette";

interface IconProps {
  color?: string;
  className?: string;
}

const outline = { stroke: COLORS.outline, strokeWidth: 2 } as const;

export function PhoneIcon({ color = COLORS.system, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x={11} y={4} width={18} height={32} rx={4} fill={color} {...outline} />
      <rect x={16} y={28} width={8} height={2.5} rx={1.25} fill={COLORS.background} />
    </svg>
  );
}

export function CalendarIcon({ color = COLORS.system, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x={5} y={8} width={30} height={26} rx={3} fill={COLORS.background} {...outline} />
      <rect x={5} y={8} width={30} height={8} rx={3} fill={color} />
      <line x1={13} y1={4} x2={13} y2={12} stroke={COLORS.outline} strokeWidth={2} />
      <line x1={27} y1={4} x2={27} y2={12} stroke={COLORS.outline} strokeWidth={2} />
    </svg>
  );
}

export function DocumentIcon({ color = COLORS.system, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x={8} y={4} width={24} height={32} rx={3} fill={COLORS.background} {...outline} />
      {[11, 17, 23].map((y) => (
        <rect key={y} x={13} y={y} width={14} height={2.5} rx={1.25} fill={color} />
      ))}
    </svg>
  );
}

export function MessageIcon({ color = COLORS.system, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x={4} y={6} width={32} height={22} rx={6} fill={color} {...outline} />
      <path d="M12 28 L12 35 L20 28 Z" fill={color} stroke={COLORS.outline} strokeWidth={2} />
    </svg>
  );
}

export function ClockIcon({ color = COLORS.system, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx={20} cy={20} r={16} fill={COLORS.background} {...outline} />
      <line x1={20} y1={20} x2={20} y2={10} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <line x1={20} y1={20} x2={27} y2={24} stroke={color} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export function MagnifyingGlassIcon({ color = COLORS.outline, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx={17} cy={17} r={11} fill="none" stroke={color} strokeWidth={4} />
      <line x1={25} y1={25} x2={35} y2={35} stroke={color} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

export function ChartBoardIcon({ color = COLORS.system, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x={3} y={3} width={34} height={34} rx={3} fill={COLORS.background} {...outline} />
      {[
        [8, 22, 6],
        [16, 16, 12],
        [24, 10, 18],
        [32, 24, 4],
      ].map(([x, y, h]) => (
        <rect key={x} x={x} y={y} width={5} height={h} fill={color} />
      ))}
    </svg>
  );
}

export function QuestionCardIcon({ color = COLORS.plumber, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x={5} y={4} width={30} height={32} rx={4} fill={COLORS.background} {...outline} />
      <text x={20} y={26} textAnchor="middle" fontSize={18} fontWeight={700} fill={color}>
        ?
      </text>
    </svg>
  );
}

export function ContactCardIcon({ color = COLORS.customer, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x={4} y={8} width={32} height={24} rx={4} fill={COLORS.background} {...outline} />
      <circle cx={13} cy={19} r={4.5} fill={color} />
      <rect x={20} y={15} width={12} height={2.5} rx={1.25} fill={color} />
      <rect x={20} y={21} width={9} height={2.5} rx={1.25} fill={COLORS.inactive} />
    </svg>
  );
}

export function CheckBadgeIcon({ color = COLORS.system, className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx={20} cy={20} r={18} fill={color} />
      <path d="M12 20 L17 25 L28 14" fill="none" stroke={COLORS.background} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
