/**
 * Họa tiết mặt trống đồng Đông Sơn (văn hóa Đông Sơn – Thanh Hóa): ngôi sao 14 cánh ở tâm,
 * các vành chấm tròn, vạch, chim Lạc bay và răng cưa. Vẽ bằng SVG, màu theo `currentColor`.
 */
const TAU = Math.PI * 2;
const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;

const STAR_POINTS = 14;
const star = Array.from({ length: STAR_POINTS * 2 }, (_, i) => pt(i % 2 === 0 ? 27 : 8, (i / (STAR_POINTS * 2)) * TAU - Math.PI / 2)).join(" ");
const dots = Array.from({ length: 28 }, (_, i) => (i / 28) * TAU);
const ticks = Array.from({ length: 72 }, (_, i) => (i / 72) * TAU);
const birds = Array.from({ length: 10 }, (_, i) => (i / 10) * 360);
const zigzag = Array.from({ length: 97 }, (_, i) => pt(i % 2 === 0 ? 86 : 91, (i / 96) * TAU)).join(" ");

/** Chim Lạc cách điệu: mỏ dài, cánh xòe, đuôi chẻ – đặt ở bán kính 72, bay theo chiều kim đồng hồ. */
const BIRD = "M -11 0 L -3 -1.6 L 2 -6 L 3 -1.2 L 9 -2.6 L 6 0 L 9 2.6 L 3 1.2 L 2 6 L -3 1.6 Z";

export function DongSonDrum({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="-100 -100 200 200" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} fill="none" stroke="currentColor">
      {title && <title>{title}</title>}
      <polygon points={star} fill="currentColor" stroke="none" />
      <circle r="31" strokeWidth="1.2" />
      <circle r="34" strokeWidth="0.6" />
      {dots.map((a) => {
        const [x, y] = pt(38.5, a).split(",");
        return <circle key={a} cx={x} cy={y} r="1.9" strokeWidth="0.7" />;
      })}
      <circle r="43" strokeWidth="0.6" />
      {ticks.map((a) => (
        <line key={a} x1={pt(45, a).split(",")[0]} y1={pt(45, a).split(",")[1]} x2={pt(52, a).split(",")[0]} y2={pt(52, a).split(",")[1]} strokeWidth="0.7" />
      ))}
      <circle r="54" strokeWidth="1" />
      <circle r="58" strokeWidth="0.5" />
      {birds.map((deg) => (
        <path key={deg} d={BIRD} transform={`rotate(${deg}) translate(0 -72) rotate(90)`} fill="currentColor" stroke="none" />
      ))}
      <circle r="83" strokeWidth="0.8" />
      <polyline points={zigzag} strokeWidth="0.7" />
      <circle r="94" strokeWidth="1.2" />
      <circle r="97" strokeWidth="0.5" />
    </svg>
  );
}
