# Implementace P1-15: Accessibility WCAG 2.1 AA

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedene zmeny

### 1. Globalni focus-visible styly — `app/globals.css`
- Pridan `*:focus-visible` s orange outline (2px solid, 2px offset)
- Reset outline pro input/select/textarea (maji vlastni focus styl)

### 2. Skip-to-content link — `app/(web)/layout.tsx`
- Pridan sr-only skip link "Prejit na obsah" (viditelny pri focus)
- Pridan `id="main-content"` na `<main>`

### 3. Modal ARIA + focus trap — `components/ui/Modal.tsx`
- Uz bylo implementovano (role="dialog", aria-modal, aria-labelledby, focus trap, Escape, focus return)
- Overeno spravnost

### 4. Tabs ARIA + keyboard — `components/ui/Tabs.tsx`
- Prepsan: pridano `role="tablist"`, `role="tab"`, `aria-selected`, `tabIndex`
- Keyboard navigace sipkami (ArrowLeft/Right, Home, End)

### 5. Input/Select/Textarea — `components/ui/Input.tsx`, `Select.tsx`, `Textarea.tsx`
- Uz byly implementovany (aria-invalid, aria-describedby, errorId, role="alert")
- Overeno spravnost

### 6. Nav aria-label — 18 souboru
- `components/main/Navbar.tsx` — "Hlavni navigace"
- `components/web/Navbar.tsx` — "Hlavni navigace"
- `components/shop/Navbar.tsx` — "Hlavni navigace"
- `components/inzerce/Navbar.tsx` — "Hlavni navigace"
- `components/marketplace/Navbar.tsx` — "Hlavni navigace"
- `components/main/MobileMenu.tsx` — "Mobilni menu"
- `components/web/MobileMenu.tsx` — "Mobilni menu"
- `components/pwa/BottomNav.tsx` — "Spodni navigace"
- `components/pwa-parts/SupplierBottomNav.tsx` — "Spodni navigace"
- `components/admin/AdminSidebar.tsx` — "Administrace"
- `components/partner/PartnerLayout.tsx` — "Partner menu"
- `app/(web)/muj-ucet/layout.tsx` — "Menu uctu"
- `app/(web)/moje-inzeraty/layout.tsx` — "Menu inzeratu"
- `app/(web)/dily/[slug]/page.tsx` — "Breadcrumb"
- `app/(web)/shop/produkt/[slug]/page.tsx` — "Breadcrumb"
- `app/(web)/inzerce/registrace/page.tsx` — "Breadcrumb"
- `app/(web)/inzerce/pridat/page.tsx` — "Breadcrumb"
- `app/(web)/nabidka/[slug]/page.tsx` — "Breadcrumb" (2x)

### 7. CookieConsent — `components/web/CookieConsent.tsx`
- Uz bylo implementovano (ref, focus management, role="dialog", aria-modal)
- Overeno spravnost

### 8. LiveRegion — `components/ui/LiveRegion.tsx` (NOVY)
- Screenreader-only component s role="alert"/"status" a aria-live

### 9. img → next/image migrace — 22 souboru
**Logo images (13 souboru):**
- Vsechny logo `<img>` migrovany na `<Image>` s width/height a `priority`
- Pridano `import Image from "next/image"`

**Content images (9 souboru):**
- `components/pwa-parts/parts/PartCard.tsx` — fill + sizes
- `app/(web)/dily/[slug]/page.tsx` — main image + thumbnails
- `app/(web)/dily/kosik/page.tsx` — cart item image
- `app/(web)/marketplace/dealer/[id]/page.tsx` — repair photos
- `components/admin/BrokerApprovalCard.tsx` — avatar
- `components/pwa/onboarding/ProfileForm.tsx` — base64 preview (unoptimized)
- `components/pwa/vehicles/DamageReportForm.tsx` — base64 preview (unoptimized)
- `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` — base64 preview (unoptimized)

## Overeni

- [x] focus-visible ring viditelny na vsech interaktivnich elementech
- [x] Skip link funguje (Tab 1x → viditelny → Enter → focus na main)
- [x] Tabs: sipky prepinaji, aria-selected spravne
- [x] Vsechny `<nav>` maji aria-label
- [x] Zadny `<img>` tag — vsude `<Image>` z next/image
- [x] CookieConsent: focus management, aria-modal
- [x] Typecheck prochazi
- [x] Unit testy prochazi (141/141)
