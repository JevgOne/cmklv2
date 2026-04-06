import { BaseCarrierClient } from "../base";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentStatus,
  DeliveryMethod,
} from "../types";

/**
 * PPL CZ — MyAPI2 (REST).
 * Docs: https://www.ppl.cz/myapi-dokumentace
 * API endpoint: https://api.dhl.com/parcel/eu/v2/shipments
 * (PPL je součást DHL Group od 2023, MyAPI používá DHL parcel API)
 *
 * Potřebné ENV:
 *   PPL_API_USERNAME  — přihlašovací údaje z myapi.ppl.cz
 *   PPL_API_PASSWORD
 *   PPL_CUSTOMER_ID   — číslo zákazníka PPL
 */
export class PplClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "PPL";

  private readonly username = process.env.PPL_API_USERNAME ?? "";
  private readonly password = process.env.PPL_API_PASSWORD ?? "";
  private readonly customerId = process.env.PPL_CUSTOMER_ID ?? "";

  isConfigured(): boolean {
    return Boolean(this.username && this.password && this.customerId);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.dryRunResult(input);
    }
    // TODO: POST https://api.dhl.com/parcel/eu/v2/shipments
    // Auth: OAuth2 (client_id/client_secret) nebo API key
    throw new Error(
      "[PplClient] Real API volání není implementováno — nastavte dry-run mode (odstraňte PPL_API_PASSWORD) nebo implementujte volání dle www.ppl.cz/myapi-dokumentace",
    );
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+PPL+${trackingNumber}`;
    }
    throw new Error("[PplClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }
    throw new Error("[PplClient] trackShipment not implemented");
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://www.ppl.cz/vyhledat-zasilku?shipmentId=${trackingNumber}`;
  }
}
