/**
 * Shipping — sdílené typy pro přímé integrace s dopravci.
 *
 * Všichni dopravci implementují stejné rozhraní `CarrierClient`.
 * Dispatcher `createShipmentForOrder()` vybere správného podle
 * `order.deliveryMethod`.
 */

/**
 * Metody doručení (musí odpovídat Order.deliveryMethod enum v Prisma schema).
 */
export type DeliveryMethod =
  | "ZASILKOVNA"
  | "DPD"
  | "PPL"
  | "GLS"
  | "CESKA_POSTA"
  | "PICKUP";

/**
 * Vstup pro vytvoření zásilky — data z Order modelu + pole z OrderItem (váha, rozměry).
 */
export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;

  // Adresa příjemce
  recipient: {
    name: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    zip: string;
    country?: string; // default "CZ"
  };

  // Zásilkovna — vybraná pobočka (pouze pro deliveryMethod === "ZASILKOVNA")
  zasilkovnaPointId?: string;
  zasilkovnaPointName?: string;

  // Parametry zásilky
  weightKg: number; // odhad/součet z OrderItems
  priceCzk: number; // hodnota zboží (pro pojištění)
  codAmountCzk?: number; // dobírka — pouze pokud paymentMethod === "COD"

  // Volitelný popis obsahu
  description?: string;
}

/**
 * Výsledek vytvoření zásilky u dopravce.
 * Vracíme z každého klienta (reálného i dry-run).
 */
export interface CreateShipmentResult {
  /** Tracking číslo pro zákazníka */
  trackingNumber: string;
  /** Jméno dopravce (např. "ZASILKOVNA", "DPD"...) */
  carrier: DeliveryMethod;
  /** URL na PDF štítek k vytištění ve vrakovišti */
  labelUrl: string;
  /** Link na veřejný tracking u dopravce */
  trackingUrl: string;
  /** Dry-run flag — true = žádné reálné API volání se nestalo */
  dryRun: boolean;
}

/**
 * Stav zásilky — pro pozdější synchronizaci (cron job nebo webhook).
 */
export interface ShipmentStatus {
  trackingNumber: string;
  state: "CREATED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "UNKNOWN";
  lastUpdate?: Date;
  lastLocation?: string;
}

/**
 * Rozhraní pro implementaci per dopravce.
 * Každý klient musí umět vytvořit zásilku, vrátit URL štítku a zjistit stav.
 */
export interface CarrierClient {
  /** Jméno dopravce (musí odpovídat DeliveryMethod enum). */
  readonly name: DeliveryMethod;

  /** Zkontroluje zda jsou k dispozici API credentials. Pokud ne → dry-run mode. */
  isConfigured(): boolean;

  /** Vytvoří zásilku u dopravce a vrátí tracking + label URL. */
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;

  /** Vrátí URL na PDF štítek (pro znovustažení). */
  getLabelUrl(trackingNumber: string): Promise<string>;

  /** Zjistí aktuální stav zásilky. */
  trackShipment(trackingNumber: string): Promise<ShipmentStatus>;
}
