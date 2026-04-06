import { BaseCarrierClient } from "../base";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentStatus,
  DeliveryMethod,
} from "../types";

/**
 * Zásilkovna (Packeta) — REST API v5.
 * Docs: https://docs.packetery.com/03-creating-shipments.html
 * API endpoint: https://www.zasilkovna.cz/api/rest
 *
 * Potřebné ENV:
 *   ZASILKOVNA_API_PASSWORD  — "API password" z admin.zasilkovna.cz → Nastavení → API
 *   ZASILKOVNA_SENDER_LABEL  — "Název odesílatele" (např. "carmakler-shop")
 *
 * Pokud chybí obě proměnné → dry-run mód (žádné reálné volání).
 */
export class ZasilkovnaClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "ZASILKOVNA";

  private readonly apiPassword = process.env.ZASILKOVNA_API_PASSWORD ?? "";
  private readonly senderLabel = process.env.ZASILKOVNA_SENDER_LABEL ?? "";

  isConfigured(): boolean {
    return Boolean(this.apiPassword && this.senderLabel);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.dryRunResult(input);
    }

    // TODO: Real API call
    // POST https://www.zasilkovna.cz/api/rest/createPacket
    // XML body se senderLabel, receiver address, addressId (zasilkovnaPointId), cod, value, weight
    // Response XML → <id>tracking number</id>
    throw new Error(
      "[ZasilkovnaClient] Real API volání není implementováno — nastavte dry-run mode (odstraňte ZASILKOVNA_API_PASSWORD) nebo implementujte volání dle docs.packetery.com",
    );
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+ZASILKOVNA+${trackingNumber}`;
    }
    // TODO: GET https://www.zasilkovna.cz/api/rest/packetLabelPdf
    // Vrací PDF přímo — uložit na Cloudinary nebo vrátit redirect URL
    throw new Error("[ZasilkovnaClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }
    // TODO: GET https://www.zasilkovna.cz/api/rest/packetStatus
    throw new Error("[ZasilkovnaClient] trackShipment not implemented");
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   * Používá se v email šablonách a tracking stránkách bez instancování klienta.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://tracking.packeta.com/cs/${trackingNumber}`;
  }
}
