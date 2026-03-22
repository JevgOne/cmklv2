import { generateBrokerageContract } from "./brokerage";
import { generateHandoverProtocol } from "./handover";
export { generateBrokerageContract, generateHandoverProtocol };

// Types
export interface ContractParty {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string; // Rodné číslo
  idCard?: string; // Číslo OP
  bankAccount?: string;
}

export interface ContractVehicle {
  vin: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  mileage: number;
  condition: string;
  color?: string;
  fuelType: string;
  transmission: string;
  enginePower?: number;
}

export interface ContractData {
  contractNumber: string;
  date: string;
  type: "BROKERAGE" | "HANDOVER";
  seller: ContractParty;
  broker: {
    name: string;
    email?: string;
    phone?: string;
  };
  vehicle: ContractVehicle;
  price: number;
  commission: number;
}

export interface ContractContent {
  title: string;
  contractNumber: string;
  date: string;
  sections: ContractSection[];
}

export interface ContractSection {
  heading: string;
  content: string;
}

export function getContractTemplate(
  type: string,
  data: ContractData
): ContractContent {
  switch (type) {
    case "BROKERAGE":
      return generateBrokerageContract(data);
    case "HANDOVER":
      return generateHandoverProtocol(data);
    default:
      throw new Error(`Neznámý typ smlouvy: ${type}`);
  }
}

export function generateContractNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CM-${year}${month}-${random}`;
}

export function formatCzechPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatCzechDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
