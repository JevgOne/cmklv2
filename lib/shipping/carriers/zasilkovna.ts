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

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                     */
  /* ------------------------------------------------------------------ */

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private async apiCall(method: string, xmlBody: string): Promise<string> {
    const url = "https://www.zasilkovna.cz/api/rest";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: xmlBody,
    });

    if (!response.ok) {
      throw new Error(
        `[ZasilkovnaClient] API ${method} HTTP ${response.status}: ${await response.text()}`,
      );
    }

    return response.text();
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.dryRunResult(input);
    }

    if (!input.zasilkovnaPointId) {
      throw new Error(
        "[ZasilkovnaClient] zasilkovnaPointId is required — customer must select pickup point via widget",
      );
    }

    // Zásilkovna API vyžaduje name/surname zvlášť
    const nameParts = input.recipient.name.trim().split(/\s+/);
    const firstName = nameParts[0] || input.recipient.name;
    const surname = nameParts.slice(1).join(" ") || firstName;

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<createPacket>
  <apiPassword>${this.escapeXml(this.apiPassword)}</apiPassword>
  <packetAttributes>
    <number>${this.escapeXml(input.orderNumber)}</number>
    <name>${this.escapeXml(firstName)}</name>
    <surname>${this.escapeXml(surname)}</surname>
    <email>${this.escapeXml(input.recipient.email)}</email>
    <phone>${this.escapeXml(input.recipient.phone)}</phone>
    <addressId>${this.escapeXml(input.zasilkovnaPointId)}</addressId>
    <value>${input.priceCzk}</value>
    <weight>${input.weightKg}</weight>
    <eshop>${this.escapeXml(this.senderLabel)}</eshop>
    <cod>${input.codAmountCzk ?? 0}</cod>
    <currency>CZK</currency>
  </packetAttributes>
</createPacket>`;

    const responseXml = await this.apiCall("createPacket", xml);

    const statusMatch = responseXml.match(/<status>(.*?)<\/status>/);
    if (statusMatch?.[1] !== "ok") {
      const faultMatch = responseXml.match(/<faultString>(.*?)<\/faultString>/);
      throw new Error(
        `[ZasilkovnaClient] createPacket failed: ${faultMatch?.[1] ?? responseXml}`,
      );
    }

    const idMatch = responseXml.match(/<id>(.*?)<\/id>/);
    const trackingNumber = idMatch?.[1];
    if (!trackingNumber) {
      throw new Error("[ZasilkovnaClient] createPacket response missing <id>");
    }

    const trackingUrl = ZasilkovnaClient.trackingUrlFor(trackingNumber);
    const labelUrl = await this.getLabelUrl(trackingNumber);

    return {
      trackingNumber,
      carrier: this.name,
      labelUrl,
      trackingUrl,
      dryRun: false,
    };
  }

  async getLabelUrl(trackingNumber: string): Promise<string> {
    if (!this.isConfigured()) {
      return `https://placehold.co/600x800/orange/white?text=DRY-RUN+ZASILKOVNA+${trackingNumber}`;
    }

    // Proxy endpoint — PDF se stáhne on-demand přes náš server
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/shipping/label/${trackingNumber}?carrier=ZASILKOVNA`;
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    if (!this.isConfigured()) {
      return this.dryRunStatus(trackingNumber);
    }

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<packetStatus>
  <apiPassword>${this.escapeXml(this.apiPassword)}</apiPassword>
  <packetId>${this.escapeXml(trackingNumber)}</packetId>
</packetStatus>`;

    const responseXml = await this.apiCall("packetStatus", xml);

    const statusCodeMatch = responseXml.match(/<statusCode>(.*?)<\/statusCode>/);
    const dateMatch = responseXml.match(/<dateTime>(.*?)<\/dateTime>/);
    const codeTextMatch = responseXml.match(/<codeText>(.*?)<\/codeText>/);

    const statusCode = parseInt(statusCodeMatch?.[1] ?? "0", 10);

    const stateMap: Record<number, ShipmentStatus["state"]> = {
      1: "CREATED",
      2: "IN_TRANSIT",
      3: "IN_TRANSIT",
      4: "IN_TRANSIT",
      5: "IN_TRANSIT",
      6: "DELIVERED",
      7: "RETURNED",
      10: "RETURNED",
    };

    return {
      trackingNumber,
      state: stateMap[statusCode] ?? "UNKNOWN",
      lastUpdate: dateMatch?.[1] ? new Date(dateMatch[1]) : new Date(),
      lastLocation: codeTextMatch?.[1] ?? undefined,
    };
  }

  /**
   * Veřejný tracking URL pro zákazníka.
   * Používá se v email šablonách a tracking stránkách bez instancování klienta.
   */
  static trackingUrlFor(trackingNumber: string): string {
    return `https://tracking.packeta.com/cs/${trackingNumber}`;
  }
}
