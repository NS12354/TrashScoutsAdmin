import { renderGuide } from "@/lib/format";

export function GuideRenderer({
  content,
  variant = "light",
}: {
  content: string;
  variant?: "dark" | "light";
}) {
  const blocks = renderGuide(content);
  const tone =
    variant === "dark"
      ? { body: "text-zinc-300", heading: "text-zinc-100" }
      : { body: "text-zinc-700", heading: "text-zinc-900" };

  return (
    <div className={`space-y-3 text-[15px] leading-relaxed ${tone.body}`}>
      {blocks.map((b, i) => {
        if (b.type === "h") {
          return (
            <h3
              key={i}
              className={`mt-4 text-base font-semibold ${tone.heading}`}
            >
              {b.text}
            </h3>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {b.items!.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}
