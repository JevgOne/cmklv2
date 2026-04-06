import { BaseCarrierClient } from "../base";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentStatus,
  DeliveryMethod,
} from "../types";

/**
 * DPD CZ — Shipper API.
 * Docs: https://docs.dpd.cz/dpd-shipper-api/
 * API endpoint: https://api.dpd.cz/shipmentservice/rest/v1/
 *
 * Potřebné ENV:
 *   DPD_API_USERNAME    — email (ten samý jako login do DPD Online)
 *   DPD_API_PASSWORD    — API password z DPD Online → API nastavení
 *   DPD_CUSTOMER_NUMBER — zákaznické číslo DPD
 */
export class DpdClient extends BaseCarrierClient {
  readonly name: DeliveryMethod = "DPD";

  private readonly username = process.env.DPD_API_USERNAME ?? "";
  private readonly password = process.env.DPD_API_PASSWORD ?? "";
  private readonly customerNumber = process.env.DPD_CUSTOMER_NUMBER ?? "";

  isConfigured(): boolean {
    return Boolean(this.username && this.password && this.customerNumber);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.dryRunResult(input);
    }
    // TODO: POST /shipmentservice/rest/v1/shipment
    // Auth: Basic (username:password)
    // Body: JSON { customerNumber, shipment: { receiver, parcel, services } }
    throw new Error(
      "[DpdClient] Real API volání není implementováno — nastavte dry-run mode (odstraňte DPD_API_PASSWORD) nebo implementujte volání dle docs.dpd.cz",
    );
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+DPD+${trackingNumber}`;
    }
    throw new Error("[DpdClient] getLabelUrl not implemented");
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }
    throw new Error("[DpdClient] trackShipment not implemented");
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://tracking.dpd.de/status/cs_CZ/parcel/${trackingNumber}`;
  }
}
