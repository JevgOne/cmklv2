import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * Vraci Resend klienta. Inicializuje lazy (pri prvnim volani).
 * Pokud RESEND_API_KEY neni nastaveny, vraci null.
 */
export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!_resend) {
    _resend = new Resend(apiKey);
  }
  return _resend;
}

/**
 * Default FROM adresa.
 */
export const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "info@carmakler.cz";

/**
 * FROM adresa pro smlouvy.
 */
export const RESEND_FROM_CONTRACTS = process.env.RESEND_FROM_EMAIL || "smlouvy@carmakler.cz";

/**
 * Odesle email pres Resend. Graceful fallback — pokud Resend neni nakonfigurovany,
 * zaloguje do konzole a vrati { success: false }.
 */
export async function sendEmail(params: {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ path?: string; filename?: string; content?: Buffer }>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResend();

  if (!resend) {
    console.warn(
      `[Email:DEV] RESEND_API_KEY not set. Would send to: ${params.to}, subject: "${params.subject}"`
    );
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const result = await resend.emails.send({
      from: params.from || RESEND_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments,
    });

    return { success: true, id: result.data?.id ?? undefined };
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
