import type {
  CarrierClient,
  CreateShipmentInput,
  CreateShipmentResult,
  DeliveryMethod,
  ShipmentStatus,
} from "./types";

/**
 * Base class pro všechny CarrierClient implementace.
 * Poskytuje sdílené helpery pro dry-run mód.
 *
 * Dry-run logika: pokud chybí API credentials (isConfigured() === false),
 * carrier client vrací fake data a loguje co by poslal reálnému API.
 * Žádné síťové volání se nedělá.
 */
export abstract class BaseCarrierClient implements CarrierClient {
  abstract readonly name: DeliveryMethod;

  abstract isConfigured(): boolean;
  abstract createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  abstract getLabelUrl(trackingNumber: string): Promise<string>;
  abstract trackShipment(trackingNumber: string): Promise<ShipmentStatus>;

  /**
   * Generuje fake tracking číslo pro dry-run.
   * Formát: DRY-{CARRIER}-{orderNumber}-{timestamp-base36}
   *
   * Dispatcher detekuje dry-run tracking podle prefixu `DRY-`.
   */
  protected generateDryRunTrackingNumber(orderNumber: string): string {
    const ts = Date.now().toString(36).toUpperCase();
    return `DRY-${this.name}-${orderNumber}-${ts}`;
  }

  /**
   * Vrátí fake dry-run result (když chybí API klíč).
   * Loguje všechny inputy, aby dev viděl v konzoli co by se poslalo reálnému API.
   */
  protected dryRunResult(input: CreateShipmentInput): CreateShipmentResult {
    const trackingNumber = this.generateDryRunTrackingNumber(input.orderNumber);
    console.log(
      `[shipping:${this.name}] DRY-RUN createShipment`,
      JSON.stringify(
        {
          orderNumber: input.orderNumber,
          recipient: input.recipient.name,
          city: input.recipient.city,
          weightKg: input.weightKg,
          priceCzk: input.priceCzk,
          codAmountCzk: input.codAmountCzk ?? null,
          zasilkovnaPointId: input.zasilkovnaPointId ?? null,
        },
        null,
        2,
      ),
    );
    return {
      trackingNumber,
      carrier: this.name,
      labelUrl: `https://placehold.co/600x800/orange/white?text=DRY-RUN+${this.name}+LABEL`,
      trackingUrl: `https://placehold.co/?tracking=${trackingNumber}`,
      dryRun: true,
    };
  }

  /**
   * Vrátí fake dry-run status (pro trackShipment bez reálného API).
   */
  protected dryRunStatus(trackingNumber: string): ShipmentStatus {
    return {
      trackingNumber,
      state: "CREATED",
      lastUpdate: new Date(),
      lastLocation: "DRY-RUN (žádné reálné volání)",
    };
  }
}
