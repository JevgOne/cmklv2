import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generuje verifika��ní token a odešle email.
 */
export async function sendVerificationEmail(email: string, firstName: string) {
  // Invalidovat staré tokeny pro tento email
  await prisma.emailVerificationToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  // Generovat nový token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  await prisma.emailVerificationToken.create({
    data: { email, token, expiresAt },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/overeni-emailu/${token}`;

  await sendEmail({
    to: email,
    subject: "Ověřte svůj email — CarMakléř",
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 32px 0;">
          <img src="${process.env.NEXTAUTH_URL}/brand/logo-dark.png" alt="CarMakléř" height="40" />
        </div>
        <h1 style="font-size: 24px; color: #18181B; margin-bottom: 16px;">
          Dobrý den, ${firstName}!
        </h1>
        <p style="font-size: 16px; color: #52525B; line-height: 1.6;">
          Děkujeme za registraci na CarMakléř. Pro dokončení registrace prosím ověřte svůj email kliknutím na tlačítko níže.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Ověřit email
          </a>
        </div>
        <p style="font-size: 14px; color: #71717A; line-height: 1.6;">
          Odkaz je platný 24 hodin. Pokud jste se neregistrovali, tento email ignorujte.
        </p>
        <hr style="border: none; border-top: 1px solid #E4E4E7; margin: 32px 0;" />
        <p style="font-size: 12px; color: #A1A1AA; text-align: center;">
          CarMakléř s.r.o. | <a href="${process.env.NEXTAUTH_URL}" style="color: #F97316;">carmakler.cz</a>
        </p>
      </div>
    `,
  });

  return token;
}

/**
 * Verifikuje token a aktivuje email.
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return { success: false, error: "Neplatný odkaz" };
  }

  if (record.used) {
    return { success: false, error: "Odkaz již byl použit" };
  }

  if (record.expiresAt < new Date()) {
    return { success: false, error: "Odkaz vypršel. Požádejte o nový." };
  }

  // Označit token jako použitý
  await prisma.emailVerificationToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  // Nastavit emailVerified na uživateli
  await prisma.user.updateMany({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });

  return { success: true, email: record.email };
}
