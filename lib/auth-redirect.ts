/**
 * Maps user role to the appropriate dashboard/landing URL after login.
 * Shared by login page and AuthButton dropdown — single source of truth.
 */
export function getRedirectByRole(role: string): string {
  switch (role) {
    case "ADMIN":
    case "BACKOFFICE":
    case "REGIONAL_DIRECTOR":
    case "MANAGER":
      return "/admin/dashboard";
    case "BROKER":
      return "/makler/dashboard";
    case "ADVERTISER":
      return "/moje-inzeraty";
    case "PARTS_SUPPLIER":
    case "WHOLESALE_SUPPLIER":
      return "/parts/my";
    case "INVESTOR":
      return "/marketplace/investor";
    case "VERIFIED_DEALER":
      return "/marketplace/dealer";
    case "PARTNER_BAZAR":
    case "PARTNER_VRAKOVISTE":
      return "/partner/dashboard";
    case "BUYER":
      return "/shop/moje-objednavky";
    default:
      return "/";
  }
}
