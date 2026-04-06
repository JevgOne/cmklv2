-- Přidat shipping pole do Order (tracking + přepravní štítek generovaný naším systémem)
ALTER TABLE "Order" ADD COLUMN "trackingCarrier" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingLabelUrl" TEXT;
