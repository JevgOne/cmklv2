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
 * API endpoint: https://myapi.ppl.cz/v2/
 * (PPL je součást DHL Group od 2023)
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

    // Real API: POST https://myapi.ppl.cz/v2/shipments
    // Auth: Basic (username:password)
    // Body: JSON {
    //   customerId, shipments: [{
    //     recipient: { name, street, city, zipCode, country, phone, email },
    //     packageInfo: { weight, reference },
    //     specialDelivery: { cod?: { amount, currency, vs } }
    //   }]
    // }
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");
    const response = await fetch("https://myapi.ppl.cz/v2/shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        customerId: this.customerId,
        shipments: [
          {
            recipient: {
              name: input.recipient.name,
              street: input.recipient.street,
              city: input.recipient.city,
              zipCode: input.recipient.zip,
              country: input.recipient.country || "CZ",
              phone: input.recipient.phone,
              email: input.recipient.email,
            },
            packageInfo: {
              weight: input.weightKg,
              reference: input.orderNumber,
            },
            ...(input.codAmountCzk
              ? {
                  specialDelivery: {
                    cod: {
                      amount: input.codAmountCzk,
                      currency: "CZK",
                      vs: input.orderNumber,
                    },
                  },
                }
              : {}),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `[PplClient] createShipment HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const data = await response.json();
    const trackingNumber = data?.shipments?.[0]?.shipmentNumber;
    if (!trackingNumber) {
      throw new Error(`[PplClient] createShipment response missing shipmentNumber`);
    }

    return {
      trackingNumber,
      carrier: this.name,
      labelUrl: await this.getLabelUrl(trackingNumber),
      trackingUrl: PplClient.trackingUrlFor(trackingNumber),
      dryRun: false,
    };
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+PPL+${trackingNumber}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/shipping/label/${trackingNumber}?carrier=PPL`;
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }

    // Real API: GET https://myapi.ppl.cz/v2/shipments/{shipmentNumber}/tracking
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");
    const response = await fetch(
      `https://myapi.ppl.cz/v2/shipments/${trackingNumber}/tracking`,
      {
        headers: { Authorization: `Basic ${auth}` },
      },
    );

    if (!response.ok) {
      console.error(`[PplClient] trackShipment HTTP ${response.status}`);
      return { trackingNumber, state: "UNKNOWN", lastUpdate: new Date() };
    }

    const data = await response.json();
    const lastEvent = data?.events?.[0];

    const stateMap: Record<string, ShipmentStatus["state"]> = {
      "1": "CREATED",
      "5": "PICKED_UP",
      "3": "IN_TRANSIT",
      "6": "IN_TRANSIT",
      "7": "DELIVERED",
      "8": "RETURNED",
    };

    return {
      trackingNumber,
      state: stateMap[lastEvent?.statusCode] ?? "UNKNOWN",
      lastUpdate: lastEvent?.date ? new Date(lastEvent.date) : new Date(),
      lastLocation: lastEvent?.location ?? undefined,
    };
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://www.ppl.cz/vyhledat-zasilku?shipmentId=${trackingNumber}`;
  }
}
