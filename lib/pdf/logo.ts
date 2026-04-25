import { readFileSync } from "fs";
import path from "path";

let _logoBase64: string | null = null;

export function getLogoBase64(): string {
  if (!_logoBase64) {
    const logoPath = path.join(process.cwd(), "public/brand/logo-dark.png");
    const buffer = readFileSync(logoPath);
    _logoBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
  }
  return _logoBase64;
}
