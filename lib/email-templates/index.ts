import type { EmailTemplateType } from "@/lib/validators/email";
import type { BrokerSignatureData } from "./signature";

export type { BrokerSignatureData } from "./signature";

import { presentationHtml, presentationText, presentationSubject } from "./presentation";
import { contractOfferHtml, contractOfferText, contractOfferSubject } from "./contract-offer";
import { followupHtml, followupText, followupSubject } from "./followup";
import { insuranceHtml, insuranceText, insuranceSubject } from "./insurance";
import { financingHtml, financingText, financingSubject } from "./financing";
import { priceChangeHtml, priceChangeText, priceChangeSubject } from "./price-change";
import { vehicleSoldHtml, vehicleSoldText, vehicleSoldSubject } from "./vehicle-sold";

// Daily summary export
export {
  dailySummaryHtml,
  dailySummaryText,
  dailySummarySubject,
} from "./daily-summary";
export type {
  DailySummaryData,
  TopVehicle,
  InquiryItem,
  PendingLead,
  StalingVehicle,
} from "./daily-summary";

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
      return { subject: presentationSubject(data), html: presentationHtml(data), text: presentationText(data) };
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
      return { subject: contractOfferSubject(data), html: contractOfferHtml(data), text: contractOfferText(data) };
    }
    case "FOLLOWUP": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        broker,
        customText,
      };
      return { subject: followupSubject(data), html: followupHtml(data), text: followupText(data) };
    }
    case "INSURANCE": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        vehicleYear: params.vehicleYear || new Date().getFullYear(),
        broker,
        customText,
      };
      return { subject: insuranceSubject(data), html: insuranceHtml(data), text: insuranceText(data) };
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
      return { subject: financingSubject(data), html: financingHtml(data), text: financingText(data) };
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
      return { subject: priceChangeSubject(data), html: priceChangeHtml(data), text: priceChangeText(data) };
    }
    case "VEHICLE_SOLD": {
      const data = {
        recipientName,
        vehicleName: params.vehicleName || "Vozidlo",
        salePrice: params.salePrice || params.price || 0,
        broker,
        customText,
      };
      return { subject: vehicleSoldSubject(data), html: vehicleSoldHtml(data), text: vehicleSoldText(data) };
    }
    default:
      throw new Error(`Neznámý typ šablony: ${templateType}`);
  }
}
