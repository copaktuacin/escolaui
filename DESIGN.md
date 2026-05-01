# EscolaUI Design System

## Direction
Premium Modern Tech — refined, authoritative school management interface combining glass-morphism layering, 6-level shadow hierarchy, and premium typography for institutional trust.

## Tone
Refined minimalism: luxury meets functionality, technical execution with zero decoration for decoration's sake. Zero compromise on clarity and information density.

## Differentiation
Frosted glass cards with precise shadow elevation + per-school dynamic brand color integration + animated sidebar active indicator create a distinctive, memorable interface. Dark slate platform admin panel visually isolates admin-only context.

## Palette

| Token           | OKLCH           | Purpose                          |
|-----------------|-----------------|----------------------------------|
| background      | 0.98 0.008 240  | Primary surface (school UI)      |
| foreground      | 0.14 0.01 240   | Primary text                     |
| card            | 1 0 0           | Elevated cards                   |
| primary         | 0.42 0.14 255   | CTA, highlights, brand accent    |
| secondary       | 0.96 0.01 240   | Subtle UI elements               |
| accent          | 0.91 0.025 240  | Focus, secondary interactive     |
| muted           | 0.93 0.015 240  | Disabled, tertiary               |
| destructive     | 0.63 0.23 25    | Danger, delete                   |
| success         | 0.72 0.19 145   | Confirmation                     |
| warning         | 0.78 0.17 65    | Alert, caution                   |
| sidebar         | 0.18 0.04 240   | School nav bg                    |
| platform-admin  | 0.13 0.02 240   | Admin panel dark slate bg        |

## Typography
- Display: Space Grotesk — headlines, section titles (font-weight 400, 700)
- Body: DM Sans — labels, form fields, table content (font-weight 400, 600)
- Mono: JetBrains Mono — code, technical values (font-weight 400, 600)

## Shadows (6 levels)
- subtle: `0 1px 2px 0 rgba(0,0,0,0.04)`
- card: `0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.03)`
- elevated: `0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)`
- floating: `0 12px 24px 0 rgba(0,0,0,0.11), 0 8px 16px -2px rgba(0,0,0,0.06)`
- modal: `0 20px 40px 0 rgba(0,0,0,0.14), 0 12px 24px -2px rgba(0,0,0,0.09)`
- overlay: `0 25px 50px 0 rgba(0,0,0,0.18)`

## Structural Zones

| Zone      | Treatment                              | Notes                                |
|-----------|----------------------------------------|--------------------------------------|
| Header    | `.glass` card, `shadow-card`           | School logo, notifications, profile  |
| Sidebar   | `bg-sidebar`, dark navy, icon-only    | Animated active indicator in brand   |
| Content   | `bg-background`, section cards       | Cards use `.glass` + `shadow-elevated`|
| Footer    | `.glass-dark`, `shadow-card`          | Metadata, pagination                 |

## Component Patterns
- Buttons: `bg-primary`, `rounded-lg`, `hover:shadow-elevated`, `active:scale-98`, `transition-smooth`
- Cards: `.glass`, `shadow-elevated`, `hover:shadow-floating hover:scale-105`, `.card-premium` for enhanced
- Forms: `.input-premium` focus-glow, `.floating-label` animated, inline validation
- Tables: sticky headers, zebra row hover, `.stagger-item` cascading rows
- Modals: `.modal-enter` scale-pop 300ms, `glass-elevated`, `shadow-modal`
- Status: `.status-indicator` with `.live` pulse, color-coded success/warning/destructive
- Toasts: `.toast-premium` slide-in-right 300ms, auto-dismiss

## Motion
- Page: fade-in 300ms, staggered rows 50ms delay per item
- Hover: Cards lift 300ms, buttons scale 98%, badges glow
- Sidebar: Active bar animates 200ms vertical slide, icons fade smooth
- Load: Skeleton shimmer infinite, spinner slow-spin 8s
- Focus: Smooth outline 150ms, form glow 200ms

## Constraints
- Use theme tokens only, never hardcoded hex; maintain school brand dynamism
- Glass-morphism on cards/modals/overlays only; solid colors for nav clarity
- Max `shadow-overlay` depth; visual hierarchy stays clear
- Cubic-bezier easing only; no elastic/bounce
- Login page: plain HTML, zero Radix/shadcn/AnimatePresence
- Platform Admin: distinct dark slate theme to visually separate admin context

## Signature Details
- Animated sidebar active indicator smoothly transitions to active nav item in school brand color
- Per-school primary color (from tenant config) dynamically applied to all CTAs, highlights, focus rings
- Frosted glass transparency + backdrop blur creates layered depth without visual noise
- Platform Admin dark slate palette instantly signals administrative context switch

