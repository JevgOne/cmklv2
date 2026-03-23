import type { EmailTemplateType } from "@/lib/validators/email";
import type { BrokerSignatureData } from "./signature";

export { generateSignatureHtml, generateSignatureText } from "./signature";
export type { BrokerSignatureData } from "./signature";

import { presentationHtml as _presHtml, presentationText as _presText, presentationSubject as _presSub } from "./presentation";
import { contractOfferHtml as _coHtml, contractOfferText as _coText, contractOfferSubject as _coSub } from "./contract-offer";
import { followupHtml as _fuHtml, followupText as _fuText, followupSubject as _fuSub } from "./followup";
import { insuranceHtml as _insHtml, insuranceText as _insText, insuranceSubject as _insSub } from "./insurance";
import { financingHtml as _finHtml, financingText as _finText, financingSubject as _finSub } from "./financing";
import { priceChangeHtml as _pcHtml, priceChangeText as _pcText, priceChangeSubject as _pcSub } from "./price-change";
import { vehicleSoldHtml as _vsHtml, vehicleSoldText as _vsText, vehicleSoldSubject as _vsSub } from "./vehicle-sold";

export {
  presentationHtml,
  presentationText,
  presentationSubject,
} from "./presentation";
export type { PresentationData } from "./presentation";

export {
  contractOfferHtml,
  contractOfferText,
  contractOfferSubject,
} from "./contract-offer";
export type { ContractOfferData } from "./contract-offer";

export {
  followupHtml,
  followupText,
  followupSubject,
} from "./followup";
export type { FollowupData } from "./followup";

export {
  insuranceHtml,
  insuranceText,
  insuranceSubject,
} from "./insurance";
export type { InsuranceData } from "./insurance";

export {
  financingHtml,
  financingText,
  financingSubject,
} from "./financing";
export type { FinancingData } from "./financing";

export {
  priceChangeHtml,
  priceChangeText,
  priceChangeSubject,
} from "./price-change";
export type { PriceChangeData } from "./price-change";

export {
  vehicleSoldHtml,
  vehicleSoldText,
  vehicleSoldSubject,
} from "./vehicle-sold";
export type { VehicleSoldData } from "./vehicle-sold";

export interface TemplateInfo {
  type: EmailTemplateType;
  name: string;
  description: string;
  requiredContext: "seller" | "buyer" | "none";
  requiresVehicle: boolean;
}

export const TEMPLATE_LIST: TemplateInfo[] = [
  {
    type: "PRESENTATION",
    name: "Prezentace Carmakler",
    description: "Představení služeb Carmakler prodejci před schůzkou",
    requiredContext: "seller",
    requiresVehicle: false,
  },
  {
    type: "CONTRACT_OFFER",
    name: "Návrh smlouvy",
    description: "Zaslání návrhu zprostředkovatelské smlouvy prodejci",
    requiredContext: "seller",
    requiresVehicle: true,
  },
  {
    type: "FOLLOWUP",
    name: "Follow-up po schůzce",
    description: "Potvrzení zadání auta do systému po schůzce s prodejcem",
    requiredContext: "seller",
    requiresVehicle: true,
  },
  {
    type: "INSURANCE",
    name: "Nabídka pojištění",
    description: "Nabídka zvýhodněného pojištění kupujícímu po prodeji",
    requiredContext: "buyer",
    requiresVehicle: true,
  },
  {
    type: "FINANCING",
    name: "Nabídka financování",
    description: "Nabídka financování vozidla kupujícímu",
    requiredContext: "buyer",
    requiresVehicle: true,
  },
  {
    type: "PRICE_CHANGE",
    name: "Doporučení snížení ceny",
    description: "Doporučení změny ceny prodejci, když se auto neprodává",
    requiredContext: "seller",
    requiresVehicle: true,
  },
  {
    type: "VEHICLE_SOLD",
    name: "Auto prodáno",
    description: "Informace o úspěšném prodeji prodejci",
    requiredContext: "seller",
    requiresVehicle: true,
  },
];

export interface GenerateEmailResult {
  subject: string;
  html: string;
  text: string;
}

export function generateEmail(
  templateType: EmailTemplateType,
  broker: BrokerSignatureData,
  params: {
    recipientName: string;
    vehicleName?: string;
    vehicleYear?: number;
    vin?: string;
    price?: number;
    newPrice?: number;
    salePrice?: number;
    monthlyPayment?: number;
    reason?: string;
    customText?: string;
  }
): GenerateEmailResult {
  const { recipientName, customText } = params;

  switch (templateType) {
    case "PRESENTATION": {
      const data = { recipientName, broker, customText };
      return { subject: _presSub(data), html: _presHtml(data), text: _presText(data) };
    }
    case "CONTRACT_OFFER": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        vin: params.vin,
        price: params.price || 0,
        broker,
        customText,
      };
      return { subject: _coSub(data), html: _coHtml(data), text: _coText(data) };
    }
    case "FOLLOWUP": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        broker,
        customText,
      };
      return { subject: _fuSub(data), html: _fuHtml(data), text: _fuText(data) };
    }
    case "INSURANCE": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        vehicleYear: params.vehicleYear || new Date().getFullYear(),
        broker,
        customText,
      };
      return { subject: _insSub(data), html: _insHtml(data), text: _insText(data) };
    }
    case "FINANCING": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        price: params.price || 0,
        monthlyPayment: params.monthlyPayment,
        broker,
        customText,
      };
      return { subject: _finSub(data), html: _finHtml(data), text: _finText(data) };
    }
    case "PRICE_CHANGE": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        currentPrice: params.price || 0,
        newPrice: params.newPrice || 0,
        reason: params.reason,
        broker,
        customText,
      };
      return { subject: _pcSub(data), html: _pcHtml(data), text: _pcText(data) };
    }
    case "VEHICLE_SOLD": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        salePrice: params.salePrice || params.price || 0,
        broker,
        customText,
      };
      return { subject: _vsSub(data), html: _vsHtml(data), text: _vsText(data) };
    }
    default:
      throw new Error(`Neznámý typ šablony: ${templateType}`);
  }
}
