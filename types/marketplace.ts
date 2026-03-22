export type FlipStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "FUNDING"
  | "FUNDED"
  | "IN_REPAIR"
  | "FOR_SALE"
  | "SOLD"
  | "PAYOUT_PENDING"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "CONFIRMED" | "REFUNDED";

export type VehicleCondition =
  | "NEW"
  | "LIKE_NEW"
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "DAMAGED";

export interface FlipOpportunity {
  id: string;
  dealerId: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  vin: string | null;
  condition: VehicleCondition;
  photos: string | null;
  purchasePrice: number;
  repairCost: number;
  estimatedSalePrice: number;
  repairDescription: string | null;
  repairPhotos: string | null;
  actualSalePrice: number | null;
  soldAt: string | null;
  status: FlipStatus;
  fundedAmount: number;
  adminNotes: string | null;
  rejectionReason: string | null;
  investments?: Investment[];
  dealer?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  investorId: string;
  opportunityId: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  returnAmount: number | null;
  paidOutAt: string | null;
  opportunity?: FlipOpportunity;
  investor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceStats {
  totalOpportunities: number;
  activeOpportunities: number;
  totalInvested: number;
  totalReturns: number;
  completedDeals: number;
  averageROI: number;
}

export interface PayoutBreakdown {
  actualProfit: number;
  investorShare: number;
  dealerShare: number;
  carmaklerShare: number;
  investments: {
    investmentId: string;
    investorId: string;
    investedAmount: number;
    returnAmount: number;
  }[];
}
