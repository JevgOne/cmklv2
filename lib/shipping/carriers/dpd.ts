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

    // Real API: POST https://api.dpd.cz/shipmentservice/rest/v1/shipment
    // Auth: Basic (username:password)
    // Body: JSON {
    //   customerNumber, shipment: {
    //     receiver: { name1, street, city, zipCode, country, phone, email },
    //     parcel: { weight, content, reference1 },
    //     productAndServiceData: { orderType: "consignment" }
    //   }
    // }
    // Response: { shipmentResponses: [{ parcelInformation: { parcelLabelNumber } }] }
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");
    const response = await fetch(
      "https://api.dpd.cz/shipmentservice/rest/v1/shipment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          customerNumber: this.customerNumber,
          shipment: {
            receiver: {
              name1: input.recipient.name,
              street: input.recipient.street,
              city: input.recipient.city,
              zipCode: input.recipient.zip,
              country: input.recipient.country || "CZ",
              phone: input.recipient.phone,
              email: input.recipient.email,
            },
            parcel: {
              weight: Math.round(input.weightKg * 100),
              content: input.description || `Objednávka ${input.orderNumber}`,
              reference1: input.orderNumber,
            },
            productAndServiceData: {
              orderType: "consignment",
              ...(input.codAmountCzk
                ? {
                    cod: {
                      amount: input.codAmountCzk,
                      currency: "CZK",
                      purpose: input.orderNumber,
                    },
                  }
                : {}),
            },
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `[DpdClient] createShipment HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const data = await response.json();
    const trackingNumber =
      data?.shipmentResponses?.[0]?.parcelInformation?.parcelLabelNumber;
    if (!trackingNumber) {
      throw new Error(
        `[DpdClient] createShipment response missing parcelLabelNumber`,
      );
    }

    return {
      trackingNumber,
      carrier: this.name,
      labelUrl: await this.getLabelUrl(trackingNumber),
      trackingUrl: DpdClient.trackingUrlFor(trackingNumber),
      dryRun: false,
    };
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+DPD+${trackingNumber}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/shipping/label/${trackingNumber}?carrier=DPD`;
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }

    // Real API: GET https://api.dpd.cz/shipmentservice/rest/v1/tracking/{parcelNumber}
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");
    const response = await fetch(
      `https://api.dpd.cz/shipmentservice/rest/v1/tracking/${trackingNumber}`,
      {
        headers: { Authorization: `Basic ${auth}` },
      },
    );

    if (!response.ok) {
      console.error(`[DpdClient] trackShipment HTTP ${response.status}`);
      return { trackingNumber, state: "UNKNOWN", lastUpdate: new Date() };
    }

    const data = await response.json();
    const statusCode = data?.trackingResult?.shipmentInfo?.status;

    const stateMap: Record<string, ShipmentStatus["state"]> = {
      SHIPMENT_CREATED: "CREATED",
      PICKUP: "PICKED_UP",
      IN_TRANSIT: "IN_TRANSIT",
      OUT_FOR_DELIVERY: "IN_TRANSIT",
      DELIVERED: "DELIVERED",
      RETURNED: "RETURNED",
    };

    return {
      trackingNumber,
      state: stateMap[statusCode] ?? "UNKNOWN",
      lastUpdate: new Date(),
      lastLocation: data?.trackingResult?.shipmentInfo?.location ?? undefined,
    };
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://tracking.dpd.de/status/cs_CZ/parcel/${trackingNumber}`;
  }
}
