import fs from "fs";
import path from "path";

const KB_DIR = path.join(process.cwd(), "docs", "knowledge-base");

let cachedKnowledgeBase: string | null = null;

export function getKnowledgeBase(): string {
  if (cachedKnowledgeBase) return cachedKnowledgeBase;

  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".md"));
  const sections = files.map((file) => {
    const content = fs.readFileSync(path.join(KB_DIR, file), "utf-8");
    return content;
  });

  cachedKnowledgeBase = sections.join("\n\n---\n\n");
  return cachedKnowledgeBase;
}
