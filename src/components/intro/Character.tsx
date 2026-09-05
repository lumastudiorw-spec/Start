import { COLORS } from "./palette";

interface ArmProps {
  side: "left" | "right";
  angleDeg: number;
  color: string;
}

function Arm({ side, angleDeg, color }: ArmProps) {
  const shoulderX = side === "left" ? 32 : 68;
  const dir = side === "left" ? -1 : 1;
  return (
    <g
      style={{
        transform: `rotate(${angleDeg}deg)`,
        transformOrigin: `${shoulderX}px 48px`,
        transition: "transform 1.4s ease-in-out",
      }}
    >
      <line x1={shoulderX} y1={48} x2={shoulderX + dir * 3} y2={92} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <circle cx={shoulderX + dir * 3} cy={92} r={5} fill={color} />
    </g>
  );
}

export interface CharacterProps {
  role: "plumber" | "customer";
  leftArmAngle?: number;
  rightArmAngle?: number;
  holdingTool?: boolean;
  className?: string;
}

/** A blank-headed stick figure — no face, ever. Torso/trouser colour is fixed per role. */
export function Character({ role, leftArmAngle = 0, rightArmAngle = 0, holdingTool = false, className }: CharacterProps) {
  const torsoColor = role === "plumber" ? COLORS.plumber : COLORS.customer;
  const legColor = role === "plumber" ? COLORS.plumber : COLORS.outline;
  const shoeColor = role === "plumber" ? COLORS.outline : COLORS.background;

  return (
    <svg viewBox="0 0 100 160" className={className} aria-hidden>
      {/* legs */}
      <rect x={34} y={95} width={13} height={45} rx={4} fill={legColor} />
      <rect x={53} y={95} width={13} height={45} rx={4} fill={legColor} />
      {/* shoes */}
      <rect x={32} y={138} width={17} height={9} rx={3} fill={shoeColor} stroke={COLORS.outline} strokeWidth={1.5} />
      <rect x={51} y={138} width={17} height={9} rx={3} fill={shoeColor} stroke={COLORS.outline} strokeWidth={1.5} />
      {/* torso */}
      <rect x={28} y={40} width={44} height={58} rx={12} fill={torsoColor} />
      {role === "plumber" && <rect x={28} y={78} width={44} height={8} fill={COLORS.system} />}
      {/* arms (behind/around torso) */}
      <Arm side="left" angleDeg={leftArmAngle} color={COLORS.outline} />
      <Arm side="right" angleDeg={rightArmAngle} color={COLORS.outline} />
      {holdingTool && (
        <g transform="translate(78, 88) rotate(20)">
          <rect x={-2} y={-14} width={4} height={16} rx={2} fill={COLORS.outline} />
          <circle cx={0} cy={-16} r={4} fill="none" stroke={COLORS.outline} strokeWidth={2.5} />
        </g>
      )}
      {/* head — completely blank, no features */}
      <circle cx={50} cy={20} r={15} fill={COLORS.background} stroke={COLORS.outline} strokeWidth={3} />
    </svg>
  );
}
