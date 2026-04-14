import { BaseCarrierClient } from "../base";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentStatus,
  DeliveryMethod,
} from "../types";

/**
 * GLS CZ — MyGLS API (REST JSON).
 * Docs: https://api.mygls.cz/index.html
 * API endpoint: https://api.mygls.cz/ParcelService.svc/json/
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

  /**
   * Konvertuje SHA-512 hex string na byte array pro GLS API.
   * GLS vyžaduje password jako byte[] (JSON array čísel 0-255).
   */
  private passwordBytes(): number[] {
    const hex = this.passwordSha512;
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.dryRunResult(input);
    }

    // Real API: POST https://api.mygls.cz/ParcelService.svc/json/PrintLabels
    // Body: JSON {
    //   Username, Password (byte[]),
    //   ParcelList: [{
    //     ClientNumber, ClientReference,
    //     CODAmount, CODReference,
    //     DeliveryAddress: { Name, Street, City, ZipCode, CountryIsoCode, ContactPhone, ContactEmail },
    //     Count: 1, Content, Weight
    //   }]
    // }
    const response = await fetch(
      "https://api.mygls.cz/ParcelService.svc/json/PrintLabels",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: this.username,
          Password: this.passwordBytes(),
          ParcelList: [
            {
              ClientNumber: parseInt(this.clientNumber, 10),
              ClientReference: input.orderNumber,
              Content: input.description || `Objednávka ${input.orderNumber}`,
              Count: 1,
              Weight: input.weightKg,
              CODAmount: input.codAmountCzk ?? 0,
              CODReference: input.codAmountCzk ? input.orderNumber : "",
              DeliveryAddress: {
                Name: input.recipient.name,
                Street: input.recipient.street,
                City: input.recipient.city,
                ZipCode: input.recipient.zip,
                CountryIsoCode: input.recipient.country || "CZ",
                ContactPhone: input.recipient.phone,
                ContactEmail: input.recipient.email,
              },
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `[GlsClient] createShipment HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const data = await response.json();
    const parcelInfo = data?.PrintLabelsInfoList?.[0];
    const trackingNumber = parcelInfo?.ParcelNumber?.toString();
    if (!trackingNumber) {
      throw new Error(`[GlsClient] createShipment response missing ParcelNumber`);
    }

    return {
      trackingNumber,
      carrier: this.name,
      labelUrl: await this.getLabelUrl(trackingNumber),
      trackingUrl: GlsClient.trackingUrlFor(trackingNumber),
      dryRun: false,
    };
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+GLS+${trackingNumber}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/shipping/label/${trackingNumber}?carrier=GLS`;
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }

    // Real API: POST https://api.mygls.cz/ParcelService.svc/json/GetParcelStatuses
    const response = await fetch(
      "https://api.mygls.cz/ParcelService.svc/json/GetParcelStatuses",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: this.username,
          Password: this.passwordBytes(),
          ParcelNumber: parseInt(trackingNumber, 10),
        }),
      },
    );

    if (!response.ok) {
      console.error(`[GlsClient] trackShipment HTTP ${response.status}`);
      return { trackingNumber, state: "UNKNOWN", lastUpdate: new Date() };
    }

    const data = await response.json();
    const lastStatus = data?.ParcelStatusList?.[0];

    const stateMap: Record<string, ShipmentStatus["state"]> = {
      "0": "CREATED",
      "1": "PICKED_UP",
      "2": "IN_TRANSIT",
      "3": "IN_TRANSIT",
      "4": "IN_TRANSIT",
      "5": "DELIVERED",
      "6": "RETURNED",
    };

    return {
      trackingNumber,
      state: stateMap[lastStatus?.StatusCode?.toString()] ?? "UNKNOWN",
      lastUpdate: lastStatus?.StatusDate
        ? new Date(lastStatus.StatusDate)
        : new Date(),
      lastLocation: lastStatus?.DepotCity ?? undefined,
    };
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://gls-group.eu/CZ/cs/sledovani-zasilek?match=${trackingNumber}`;
  }
}
