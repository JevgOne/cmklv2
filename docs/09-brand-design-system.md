# Carmakler - Brand Identity & Design System

## 🎨 Barevná paleta

### Primární barvy

```css
:root {
  /* Oranžová - Primary (energie, akce, CTA) */
  --orange-50: #FFF7ED;
  --orange-100: #FFEDD5;
  --orange-200: #FED7AA;
  --orange-300: #FDBA74;
  --orange-400: #FB923C;
  --orange-500: #F97316;  /* ← HLAVNÍ */
  --orange-600: #EA580C;
  --orange-700: #C2410C;
  --orange-800: #9A3412;
  --orange-900: #7C2D12;

  /* Šedá - Neutral (texty, pozadí, bordery) */
  --gray-50: #FAFAFA;
  --gray-100: #F4F4F5;
  --gray-200: #E4E4E7;
  --gray-300: #D4D4D8;
  --gray-400: #A1A1AA;
  --gray-500: #71717A;
  --gray-600: #52525B;
  --gray-700: #3F3F46;
  --gray-800: #27272A;
  --gray-900: #18181B;

  /* Černá & Bílá */
  --black: #0A0A0A;
  --white: #FFFFFF;

  /* Sémantické barvy */
  --success: #22C55E;  /* Zelená - schváleno, aktivní */
  --warning: #EAB308;  /* Žlutá - čeká, pozor */
  --error: #EF4444;    /* Červená - chyba, zamítnuto */
  --info: #3B82F6;     /* Modrá - informace */
}
```

### Použití barev

| Účel | Barva | Kód |
|------|-------|-----|
| **CTA tlačítka** | Orange 500 | `#F97316` |
| **CTA hover** | Orange 600 | `#EA580C` |
| **Hlavní nadpisy** | Gray 900 / Black | `#18181B` |
| **Text** | Gray 700 | `#3F3F46` |
| **Sekundární text** | Gray 500 | `#71717A` |
| **Pozadí stránky** | Gray 50 | `#FAFAFA` |
| **Karty** | White | `#FFFFFF` |
| **Bordery** | Gray 200 | `#E4E4E7` |
| **Dark sections** | Gray 900 | `#18181B` |
| **Akcentové prvky** | Orange 500 | `#F97316` |

---

## 🔤 Typografie

### Font Family

```css
:root {
  /* Hlavní font - moderní, čitelný */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Alternativa pro nadpisy (volitelné) */
  --font-display: 'Manrope', var(--font-sans);
}
```

### Font Sizes (Tailwind)

```css
/* Mobilní / Desktop */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */
```

### Hierarchie

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| H1 (Hero) | 48-60px | 700 Bold | Gray 900 |
| H2 (Sekce) | 30-36px | 700 Bold | Gray 900 |
| H3 (Podsekce) | 24px | 600 Semi | Gray 900 |
| H4 (Karty) | 18-20px | 600 Semi | Gray 800 |
| Body | 16px | 400 Regular | Gray 700 |
| Small | 14px | 400 Regular | Gray 500 |
| Caption | 12px | 500 Medium | Gray 500 |

---

## 📐 Spacing & Layout

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius

```css
--radius-sm: 0.25rem;   /* 4px - malé prvky */
--radius-md: 0.5rem;    /* 8px - tlačítka, inputy */
--radius-lg: 0.75rem;   /* 12px - karty */
--radius-xl: 1rem;      /* 16px - modaly */
--radius-2xl: 1.5rem;   /* 24px - velké karty */
--radius-full: 9999px;  /* pill shape */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-card-hover: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

---

## 🧩 UI Komponenty

### Tlačítka

```
PRIMARY (Orange)
┌─────────────────────────────────────┐
│         Kontaktovat makléře         │  bg: orange-500
│                                     │  text: white
└─────────────────────────────────────┘  hover: orange-600
                                         shadow: shadow-md

SECONDARY (Outline)
┌─────────────────────────────────────┐
│           Zobrazit detail           │  bg: transparent
│                                     │  border: gray-300
└─────────────────────────────────────┘  text: gray-700
                                         hover: bg-gray-50

GHOST
┌─────────────────────────────────────┐
│              Zrušit                 │  bg: transparent
│                                     │  text: gray-600
└─────────────────────────────────────┘  hover: bg-gray-100

DARK (na tmavém pozadí)
┌─────────────────────────────────────┐
│         Prodat auto                 │  bg: white
│                                     │  text: gray-900
└─────────────────────────────────────┘  hover: bg-gray-100
```

### Karty vozů

```
┌────────────────────────────────────────────┐
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ │              📷 FOTKA                  │ │  aspect-ratio: 4/3
│ │                                        │ │  border-radius: 12px 12px 0 0
│ │  🔥 TOP                    ❤️          │ │  badge: orange-500
│ └────────────────────────────────────────┘ │
│                                            │
│  Škoda Octavia RS 2.0 TSI                  │  font: 18px/600
│  2020 • 85 000 km • Benzín • DSG           │  font: 14px/400, gray-500
│                                            │
│  📍 Praha 4          👤 Jan N. ⭐4.9       │  font: 14px, gray-500
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  👁 234      🔴 3 právě prohlíží     │  │  font: 12px, gray-500
│  └──────────────────────────────────────┘  │  live: red dot pulse
│                                            │
│  450 000 Kč                                │  font: 24px/700, gray-900
│                                            │
│  [    Zobrazit detail    ]                 │  button: secondary
│                                            │
└────────────────────────────────────────────┘
  bg: white
  border-radius: 12px
  shadow: shadow-card
  hover: shadow-card-hover + translateY(-2px)
```

### Input Fields

```
NORMAL
┌─────────────────────────────────────────────┐
│  Značka                                     │  label: 14px, gray-700
├─────────────────────────────────────────────┤
│  Vyberte značku                         ▾  │  input: 16px, gray-900
└─────────────────────────────────────────────┘  border: gray-300
                                                 bg: white
                                                 radius: 8px
                                                 focus: ring-2 orange-500

ERROR
┌─────────────────────────────────────────────┐
│  Email                                      │  label: 14px, gray-700
├─────────────────────────────────────────────┤
│  invalid@                                   │  border: red-500
└─────────────────────────────────────────────┘  
  ⚠️ Zadejte platný email                        error: 14px, red-500
```

### Badges & Tags

```
STATUS BADGES
┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐
│ 🟢 Aktivní│  │ 🟡 Čeká   │  │ 🔴 Odmít.│  │ 🔵 Rezerv. │
└──────────┘  └───────────┘  └──────────┘  └────────────┘
  bg: green-50    bg: yellow-50   bg: red-50     bg: blue-50
  text: green-700 text: yellow-700 text: red-700 text: blue-700
  border: green-200 ...

FEATURE TAGS (výbava)
┌────────────┐ ┌─────┐ ┌───────────┐
│ Klimatizace │ │ LED │ │ Navigace  │
└────────────┘ └─────┘ └───────────┘
  bg: gray-100
  text: gray-700
  radius: 6px
  padding: 4px 12px

HIGHLIGHT BADGE
┌──────────────┐
│  🔥 TOP      │
└──────────────┘
  bg: orange-500
  text: white
  radius: 6px
  position: absolute top-left
```

### Navigation

```
HEADER (Desktop)
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  🚗 CARMAKLER        Vozy   Makléři   Prodat auto   O nás    [Přihlásit] │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
  bg: white
  border-bottom: 1px gray-200
  shadow: shadow-sm
  height: 72px
  
  logo: orange-500 accent
  links: gray-700, hover: gray-900
  CTA: orange-500 button

HEADER (Sticky on scroll)
  bg: white/95
  backdrop-filter: blur(8px)
```

---

## 🎨 Logo koncept

### Primární logo

```
    ╱╲
   ╱  ╲
  ╱ 🚗 ╲     CARMAKLER
  ╲    ╱     
   ╲  ╱      Váš osobní automakléř
    ╲╱

Nebo jednodušší:

🚗 CARMAKLER
   ━━━━━━━━
   oranžový podtržení
```

### Logo varianty

| Varianta | Použití |
|----------|---------|
| **Full color** | Světlé pozadí, hlavní použití |
| **White** | Tmavé pozadí, footer, dark sections |
| **Orange** | Jednobarvé aplikace |
| **Icon only** | Favicon, app icon, malé prostory |

### Logo ochranná zóna

```
        ┌─────────────────────────────┐
        │     min. 1x výška loga      │
        │  ┌─────────────────────┐    │
        │  │   🚗 CARMAKLER      │    │
        │  └─────────────────────┘    │
        │                             │
        └─────────────────────────────┘
```

---

## 📱 Responzivní breakpointy

```css
/* Tailwind defaults */
--screen-sm: 640px;    /* Mobil landscape */
--screen-md: 768px;    /* Tablet */
--screen-lg: 1024px;   /* Desktop */
--screen-xl: 1280px;   /* Wide desktop */
--screen-2xl: 1536px;  /* Ultra wide */
```

### Grid

```
Mobile (< 640px):     1 sloupec, padding 16px
Tablet (768px+):      2 sloupce vozů
Desktop (1024px+):    3 sloupce vozů
Wide (1280px+):       4 sloupce vozů
```

---

## 🌙 Dark Mode (volitelné, pro PWA)

```css
/* Dark mode paleta */
.dark {
  --bg-primary: #0A0A0A;
  --bg-secondary: #18181B;
  --bg-card: #27272A;
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --border: #3F3F46;
  
  /* Orange zůstává stejná */
  --accent: #F97316;
}
```

---

## ✨ Animace & Přechody

```css
/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;

/* Hover efekty */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  transition: var(--transition-normal);
}

.button:hover {
  transform: scale(1.02);
  transition: var(--transition-fast);
}

/* Live viewer pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.live-dot {
  animation: pulse 2s infinite;
}
```

---

## 📋 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Manrope', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
}
```

---

## 🎯 Design Principles

### 1. Důvěra první
- Čisté, profesionální rozhraní
- Jasná hierarchie informací
- Trust badges viditelné

### 2. Mobile first
- 60%+ návštěvnosti z mobilu
- Touch-friendly prvky (min. 44px)
- Rychlé načítání

### 3. Akce jasně viditelné
- CTA tlačítka oranžová, výrazná
- Jeden hlavní CTA per screen
- Sekundární akce méně výrazné

### 4. Konzistence
- Stejné komponenty všude
- Předvídatelné chování
- Jednotná ikonografie (Lucide icons)

---

## 📁 Assets ke stažení

Pro designéra připravit:
- [ ] Logo (SVG, PNG ve všech variantách)
- [ ] Favicon set (16, 32, 180, 192, 512)
- [ ] OG image template (1200x630)
- [ ] App icons pro PWA
- [ ] Placeholder image pro vozy
- [ ] Icon set (Lucide)
