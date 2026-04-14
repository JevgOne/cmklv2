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

    // Real API: POST https://b2b.postaonline.cz/restservices/ZSKService/v1/sendParcels
    // Auth: Basic (username:password)
    // Body: JSON {
    //   idCustomer, parcels: [{
    //     parcelType: "BA",  (Balík Na poštu / DR = Balík Do ruky)
    //     weight, price,
    //     addressee: { name, street, city, zipCode, phone, email },
    //     cod?: { amount, currency, vs }
    //   }]
    // }
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");
    const response = await fetch(
      "https://b2b.postaonline.cz/restservices/ZSKService/v1/sendParcels",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          idCustomer: this.customerId,
          parcels: [
            {
              parcelType: "DR",
              weight: Math.round(input.weightKg * 1000),
              price: input.priceCzk,
              note: input.description || `Objednávka ${input.orderNumber}`,
              addressee: {
                name: input.recipient.name,
                street: input.recipient.street,
                city: input.recipient.city,
                zipCode: input.recipient.zip,
                phone: input.recipient.phone,
                email: input.recipient.email,
              },
              ...(input.codAmountCzk
                ? {
                    cod: {
                      amount: input.codAmountCzk,
                      currency: "CZK",
                      vs: input.orderNumber,
                    },
                  }
                : {}),
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `[CeskaPostaClient] createShipment HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const data = await response.json();
    const trackingNumber = data?.parcels?.[0]?.parcelCode;
    if (!trackingNumber) {
      throw new Error(
        `[CeskaPostaClient] createShipment response missing parcelCode`,
      );
    }

    return {
      trackingNumber,
      carrier: this.name,
      labelUrl: await this.getLabelUrl(trackingNumber),
      trackingUrl: CeskaPostaClient.trackingUrlFor(trackingNumber),
      dryRun: false,
    };
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+POSTA+${trackingNumber}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/shipping/label/${trackingNumber}?carrier=CESKA_POSTA`;
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }

    // Real API: GET https://b2b.postaonline.cz/restservices/ZSKService/v1/parcels/{parcelCode}
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");
    const response = await fetch(
      `https://b2b.postaonline.cz/restservices/ZSKService/v1/parcels/${trackingNumber}`,
      {
        headers: { Authorization: `Basic ${auth}` },
      },
    );

    if (!response.ok) {
      console.error(`[CeskaPostaClient] trackShipment HTTP ${response.status}`);
      return { trackingNumber, state: "UNKNOWN", lastUpdate: new Date() };
    }

    const data = await response.json();
    const lastEvent = data?.events?.[0];

    const stateMap: Record<string, ShipmentStatus["state"]> = {
      posted: "CREATED",
      "in-transport": "IN_TRANSIT",
      "at-post-office": "IN_TRANSIT",
      "out-for-delivery": "IN_TRANSIT",
      delivered: "DELIVERED",
      returned: "RETURNED",
    };

    return {
      trackingNumber,
      state: stateMap[lastEvent?.type] ?? "UNKNOWN",
      lastUpdate: lastEvent?.date ? new Date(lastEvent.date) : new Date(),
      lastLocation: lastEvent?.postOffice ?? undefined,
    };
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://www.postaonline.cz/trackandtrace/-/zasilka/cislo?parcelNumbers=${trackingNumber}`;
  }
}
