export type Section = { heading: string; body: string; intro?: boolean };

// Splits a markdown-ish guide into sections by `## Heading` lines.
// Content before the first heading is returned as a leading intro section.
export function parseSections(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const m = /^##\s+(.+)$/.exec(line);
    if (m && m[1]) {
      if (current) sections.push(current);
      current = { heading: m[1].trim(), body: "" };
      continue;
    }
    if (!current) {
      // Lines before any heading.
      current = { heading: "Overview", body: "", intro: true };
    }
    current.body += (current.body ? "\n" : "") + line;
  }
  if (current) {
    if (current.body.trim() || current.heading !== "Overview" || !current.intro) {
      sections.push(current);
    }
  }
  return sections.map((s) => ({ ...s, body: s.body.trim() }));
}
