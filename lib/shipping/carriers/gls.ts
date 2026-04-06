import { BaseCarrierClient } from "../base";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentStatus,
  DeliveryMethod,
} from "../types";

/**
 * GLS CZ — MyGLS API (REST JSON).
 * Docs: https://mygls.gls-czech.cz/MyGLS/api
 * API endpoint: https://api.mygls.cz/ParcelService.svc/json/PrintLabels
 *
 * Potřebné ENV:
 *   GLS_API_USERNAME         — přihlašovací email do MyGLS
 *   GLS_API_PASSWORD_SHA512  — heslo hashované SHA-512 (GLS to takhle vyžaduje)
 *   GLS_CLIENT_NUMBER        — zákaznické číslo (ClientNumber)
 *
 * POZOR: Heslo MUSÍ být SHA-512 hash, ne plaintext.
 * Hash lze vygenerovat: `echo -n "mojeheslo" | shasum -a 512`
 */
export class GlsClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "GLS";

  private readonly username = process.env.GLS_API_USERNAME ?? "";
  private readonly passwordSha512 = process.env.GLS_API_PASSWORD_SHA512 ?? "";
  private readonly clientNumber = process.env.GLS_CLIENT_NUMBER ?? "";

  isConfigured(): boolean {
    return Boolean(this.username && this.passwordSha512 && this.clientNumber);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.dryRunResult(input);
    }
    // TODO: POST https://api.mygls.cz/ParcelService.svc/json/PrintLabels
    // Body: JSON { Username, Password (byte[] SHA-512), ParcelList: [...] }
    // Password musí být předán jako byte array z SHA-512 hashe
    throw new Error(
      "[GlsClient] Real API volání není implementováno — nastavte dry-run mode (odstraňte GLS_API_PASSWORD_SHA512) nebo implementujte volání dle mygls.gls-czech.cz/MyGLS/api",
    );
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+GLS+${trackingNumber}`;
    }
    throw new Error("[GlsClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }
    throw new Error("[GlsClient] trackShipment not implemented");
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://gls-group.eu/CZ/cs/sledovani-zasilek?match=${trackingNumber}`;
  }
}
