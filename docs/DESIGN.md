---
name: Laris Manis
description: Warm Campus Deli & Street Food Editorial Design System
colors:
  primary: "#c2410c"
  primary-hover: "#9a3412"
  primary-light: "#ffedd5"
  neutral-bg: "#fcfbf9"
  surface-card: "#ffffff"
  surface-muted: "#f5f3ef"
  text-primary: "#1c1917"
  text-secondary: "#57534e"
  text-muted: "#78716c"
  border-subtle: "#e7e2d9"
  border-strong: "#d6cfc4"
  badge-spicy: "#dc2626"
  success: "#15803d"
  success-bg: "#f0fdf4"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  caption:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  price:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

## Overview

Laris Manis is a mobile-first campus food ordering and point-of-sale interface. The visual world rejects generic SaaS AI tropes (such as multicolored gradient overlays, floating glassmorphic cards, and decorative emojis) in favor of a tactile, appetizing **Warm Campus Deli & Street Food Editorial** aesthetic.

## Colors

- **Primary (`#c2410c` / Terracotta Chili):** The signature spicy tone. Used intentionally for critical transactional actions (Add to Order, Checkout, Active States).
- **Neutral Background (`#fcfbf9` / Warm Paper):** Soft unbleached paper tone that prevents harsh screen glare in bright campus environments while maintaining >12:1 contrast against dark text.
- **Surface Muted (`#f5f3ef` / Deli Kraft):** Deliberate background for secondary containers, chips, and table headers.
- **Text Primary (`#1c1917` / Warm Charcoal):** Maximum legibility for food names, prices, and quantities.
- **Text Secondary (`#57534e`):** Clear descriptions with guaranteed ≥4.5:1 WCAG AA contrast.
- **Borders (`#e7e2d9`):** Crisp 1px division resembling printed menu slips.

## Typography

- Uses **Plus Jakarta Sans** with deliberate geometric hierarchy.
- **Headlines:** Tight negative tracking (`-0.02em` to `-0.03em`), high weight (700/800), strictly without gradient fills.
- **Prices:** Tabular numbers with bold emphasis, always placed adjacent to the corresponding item title and action.
- **Body & Microcopy:** Short, scannable phrases (10–18 words max) explaining ingredients and taste profile.

## Layout

- **Mobile Thumb-Zone Priority:** All primary actions (Add, Change Option, View Cart, Checkout) are anchored in the lower 60% of the viewport.
- **Permanent Sticky Bottom Bar:** Total count and direct Checkout trigger remain visible throughout menu browsing.
- **Grid:** Clean 1-column layout on mobile, transitioning to 2 scannable columns on tablet/desktop.

## Elevation & Depth

- **Tactile & Grounded:** Relies on clean 1px borders (`#e7e2d9`) and subtle natural directional shadows (`shadow-sm`), avoiding exaggerated blurry halos or hard brutalist blocks.
- **Interactive Depress:** Interactive buttons use active scale (`active:scale-[0.98]`) for immediate haptic-like tactile feedback.

## Shapes

- **Corner Radii:** Moderated curves (`rounded-xl` / `rounded-2xl` 14–16px) that echo clean physical takeaway packaging, rather than extreme circular bubbles (`rounded-3xl` / `rounded-[40px]`).
- **Touch Targets:** Minimum 44×44 CSS px (`min-h-[44px]` and `min-w-[44px]`) on all interactive buttons, steppers, and pill filters.

## Components

- **Menu Item Card:** High-contrast layout with real food photography, inline portion selectors, and prominent pricing.
- **Portion Selector:** Direct radio-style pills with clear savings badges (`Hemat Rp1.000`).
- **Invoice & QRIS Sheet:** Structured like a clean printed cashier receipt, featuring the exact amount first, 1-click amount copy, save-QRIS-to-gallery, and direct WhatsApp sync.
- **Admin & POS Drawer:** High-density, high-contrast operational console for 11 team members with quick status toggles and instant walk-in entry.

## Do's and Don'ts

### Do
- Always provide at least 44px touch targets on primary controls.
- Keep pricing conspicuous and tabular.
- Use explicit verbs on buttons ("Pesan Sekarang", "Simpan QRIS", "Kirim Bukti").
- Ensure all text passes WCAG 2.2 AA contrast standards.
- Provide immediate visual confirmation upon every touch.

### Don't
- Don't use decorative kickers or eyebrow tags above titles.
- Don't use gradient text or rainbow gradient card backgrounds.
- Don't use emojis as the primary icon system.
- Don't hide the cart or subtotal in distant nested menus.
- Don't allow duplicate submissions during network operations.
