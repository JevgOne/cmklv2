import { BaseCarrierClient } from "../base";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentStatus,
  DeliveryMethod,
} from "../types";

/**
 * Česká pošta — Podání Online (API).
 * Docs: https://www.ceskaposta.cz/sluzby/obchodni-psani/podani-online
 * API endpoint: https://b2b.postaonline.cz/restservices/ZSKService/v1/
 *
 * Potřebné ENV:
 *   CESKA_POSTA_API_USERNAME  — uživatelské jméno pro B2B portál
 *   CESKA_POSTA_API_PASSWORD  — heslo
 *   CESKA_POSTA_CUSTOMER_ID   — IČO smluvního zákazníka
 */
export class CeskaPostaClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "CESKA_POSTA";

  private readonly username = process.env.CESKA_POSTA_API_USERNAME ?? "";
  private readonly password = process.env.CESKA_POSTA_API_PASSWORD ?? "";
  private readonly customerId = process.env.CESKA_POSTA_CUSTOMER_ID ?? "";

  isConfigured(): boolean {
    return Boolean(this.username && this.password && this.customerId);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.dryRunResult(input);
    }
    // TODO: POST https://b2b.postaonline.cz/restservices/ZSKService/v1/sendParcels
    // Auth: Basic (username:password)
    // Body: JSON { idCustomer, parcels: [...] }
    throw new Error(
      "[CeskaPostaClient] Real API volání není implementováno — nastavte dry-run mode (odstraňte CESKA_POSTA_API_PASSWORD) nebo implementujte volání dle ceskaposta.cz/sluzby/obchodni-psani/podani-online",
    );
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+POSTA+${trackingNumber}`;
    }
    throw new Error("[CeskaPostaClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }
    throw new Error("[CeskaPostaClient] trackShipment not implemented");
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://www.postaonline.cz/trackandtrace/-/zasilka/cislo?parcelNumbers=${trackingNumber}`;
  }
}
