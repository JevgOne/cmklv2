import { emailLayoutHTML } from "@/lib/brand-styles";

export function formatCzk(amount: number): string {
  return new Intl.NumberFormat("cs-CZ").format(amount) + " Kc";
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailLayout(content: string, signatureHtml: string): string {
  return emailLayoutHTML(content, signatureHtml);
}
