// Hebrew is RTL, but equations must read left-to-right ("7 × 5 = 35").
// Wrap every math run in an isolated LTR span.
const MATH = /(\d[\d\s×+−=÷→]*\d|\d)/g;

export function MathText({ text }: { text: string }) {
  const parts = text.split(MATH);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <span key={i} className="ltr">{p.trim()}</span> : p))}
    </>
  );
}
