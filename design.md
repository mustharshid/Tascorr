# tascorr Design System — Adaptive Premium Glassmorphism Theme

## 1. High-Level Vision & Aesthetic

The **tascorr** platform has evolved its visual language to a **Premium Glassmorphism** design system. The core identity is built on multi-layered depth, structural frosted-glass panels, crisp light-catching borders, and vibrant diffused ambient glows that bleed through semi-transparent surfaces — creating a sense of premium depth and material richness.

### Core Experience Attributes
* **What tascorr IS:** Premium, Sophisticated, Immersive, Trustworthy, Operationally Dense, and Strikingly Beautiful.
* **What tascorr IS NOT:** Flat, Opaque, Lifeless, Overly Playful, Cluttered, or Intimidating.

### Design Directive
The glassmorphism aesthetic is a **skin applied over the existing layout architecture**. It does not alter structural placement, routing, component logic, or core data hierarchy. It redefines the visual material of existing layout blocks, cards, sidebars, and panels using the primitives documented below.

---

## 2. Design Principles

### Principle 1: Information Through Glass — Never Lost In It
Frosted surfaces must amplify data clarity, not obscure it. All glass panels must maintain sufficient luminance contrast on text and data elements so that critical executive information (urgency, blockers, task delta) remains legible at a glance — even over complex background gradients.

### Principle 2: Depth as Hierarchy
Layered glass panels replace flat color fills as the primary tool for establishing visual hierarchy. Foreground panels feel elevated and weightier, while background surfaces recede. Depth is communicated via:
* Increasing backdrop blur intensity from background → foreground.
* Progressively higher translucency alpha on closer/more prominent panels.
* Incrementally wider, softer box shadows on forward surfaces.

### Principle 3: Theme Interchangeability is Inviolable
Every color token, backdrop opacity, border alpha, ambient glow intensity, and gradient direction must scale fluidly across `light` and `dark` theme states. Zero hardcoded color values may appear outside the design token system.

### Principle 4: Motion Reinforces Material
Transitions must feel physically believable — glass refracting, surfaces rising, glows pulsing with restrained energy. Never jarring. Never decorative for its own sake.

> **Ultimate Directive:** Glassmorphism serves information. Whenever the frosted aesthetic conflicts with legibility or operational clarity, strip back the opacity and increase contrast until data wins.

---

## 3. Color Token System

### 3.1 Light Mode — Glass Foundation

| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--bg-primary` | `rgba(255, 255, 255, 0.55)` | Primary glass panel surface — main content containers, sidebar. |
| `--bg-secondary` | `rgba(248, 249, 251, 0.45)` | Secondary panel fill — table headers, subsections, row alternates. |
| `--bg-tertiary` | `rgba(243, 244, 246, 0.35)` | Tertiary wells — deep input backgrounds, nested list items. |
| `--glass-surface` | `rgba(255, 255, 255, 0.60)` | Explicit floating glass card surface token. |
| `--glass-border` | `rgba(255, 255, 255, 0.70)` | Specular top/left glass edge highlight. |
| `--glass-shadow` | `rgba(31, 38, 135, 0.08)` | Primary panel depth shadow (light mode). |
| `--text-primary` | `#111827` | High-contrast headers, body text, critical values. |
| `--text-secondary` | `#6B7280` | Subtitles, metadata, captions. |
| `--border-neutral` | `rgba(209, 213, 219, 0.50)` | Hairline structural dividers (semi-transparent). |

### 3.2 Dark Mode — Glass Foundation

| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--bg-primary` | `rgba(18, 18, 22, 0.75)` | Primary dark glass canvas — deep charcoal base. |
| `--bg-secondary` | `rgba(28, 28, 34, 0.65)` | Secondary dark surface — sidebars, table headers. |
| `--bg-tertiary` | `rgba(38, 38, 46, 0.55)` | Tertiary — wells, nested containers. |
| `--glass-surface` | `rgba(255, 255, 255, 0.07)` | Dark glass card surface — ultra-low alpha frosted panel. |
| `--glass-border` | `rgba(255, 255, 255, 0.12)` | Specular light catch on dark glass edge. |
| `--glass-shadow` | `rgba(0, 0, 0, 0.40)` | Deep shadow for dark mode panel elevation. |
| `--text-primary` | `#F9FAFB` | High-contrast primary text on dark surfaces. |
| `--text-secondary` | `#9CA3AF` | Muted metadata labels on dark. |
| `--border-neutral` | `rgba(255, 255, 255, 0.08)` | Subtle hairlines on dark panels. |

### 3.3 Accent System — Navy & Vibrant Hits

The Navy accent family remains the primary brand identity. In the glassmorphism system, accents function as **vibrant cuts through frosted surfaces** — concentrated color hits that punctuate the muted, blurred canvas.

* `--accent-navy-primary` (`#1E3A5F`): Primary CTA buttons, active nav indicators, core links.
* `--accent-navy-secondary` (`#2C4F7C`): Hover/active states on primary actions.
* `--accent-navy-light` (`rgba(30, 58, 95, 0.10)`): Active nav row background tint on glass.
* `--accent-glow` (`rgba(44, 79, 124, 0.25)`): Ambient glow token — bleeds into background blobs.

### 3.4 Semantic Status Colors (Glassmorphism Context)

Status Pill Badges are adapted for glass surfaces — they use a slightly higher opacity background fill to remain legible through the diffused blur layers.

* `--status-success` (`#15803D`) — Filled pill: `rgba(21, 128, 61, 0.15)` background.
* `--status-warning` (`#CA8A04`) — Filled pill: `rgba(202, 138, 4, 0.15)` background.
* `--status-danger` (`#DC2626`) — Filled pill: `rgba(220, 38, 38, 0.15)` background.
* `--status-info` (`#2563EB`) — Filled pill: `rgba(37, 99, 235, 0.15)` background.

### 3.5 Border Radius Tokens (Unchanged)

| Token | Value | Application |
| :--- | :--- | :--- |
| `--radius-sm` | `4px` | Micro-elements, badges, tags. |
| `--radius-md` | `8px` | Input fields, buttons, dropdowns. *(Increased from 6px for glassmorphism softness.)* |
| `--radius-lg` | `16px` | Glass panel cards, modal sheets, sidebar. *(Increased from 12px.)* |
| `--radius-xl` | `24px` | Full-bleed hero panels, floating overlays. |

---

## 4. Core Glassmorphism Styling Rules

These rules are **universal** and must be applied to all structural containers, cards, sidebars, and panel elements throughout the application.

### 4.1 Translucency & Alpha Blending

Replace all solid fill backgrounds with semi-transparent `rgba()` values from the token system above. Containers must allow underlying gradient blobs to subtly peek through and illuminate the surface from behind.

```css
/* Example: Glass Card Surface */
background-color: var(--glass-surface);
```

### 4.2 Backdrop Blur

Apply `backdrop-filter: blur()` to all glass panel elements. Blur intensity increases with perceived proximity to the foreground:

| Panel Layer | Blur Value |
| :--- | :--- |
| Background canvas layer | `blur(0px)` — raw background |
| Sidebar & navigation rail | `blur(20px)` |
| Primary dashboard cards | `blur(24px)` |
| Floating modals & drawers | `blur(32px)` |
| Tooltip overlays & pills | `blur(40px)` |

```css
/* Example: Standard Glass Card */
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
```

### 4.3 Specular Border (Light-Catch Edge)

Every glass panel must have a 1px specular border that simulates catching ambient light on the top and left edges. This creates the distinctive glass material feel:

```css
/* Light Mode specular glass border */
border: 1px solid var(--glass-border);

/* Advanced: gradient specular edge (optional, for hero panels) */
border-image: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.80) 0%,
  rgba(255, 255, 255, 0.25) 50%,
  rgba(255, 255, 255, 0.05) 100%
) 1;
```

### 4.4 Layered Depth via Box Shadow

All glass panels must carry a multi-layered `box-shadow` to create convincing material elevation. Use wide radiuses and very low opacities for a premium, diffuse lift effect:

```css
/* Standard Glass Card Shadow — Light Mode */
box-shadow:
  0 4px 16px var(--glass-shadow),
  0 1px 4px rgba(31, 38, 135, 0.04),
  inset 0 1px 0 rgba(255, 255, 255, 0.80);

/* Standard Glass Card Shadow — Dark Mode */
box-shadow:
  0 8px 32px var(--glass-shadow),
  0 2px 8px rgba(0, 0, 0, 0.25),
  inset 0 1px 0 rgba(255, 255, 255, 0.08);
```

---

## 5. Ambient Lighting & Background Canvas

### 5.1 Background Gradient Blobs

The application background canvas must feature soft, large, out-of-focus radial gradient "blobs" that provide the ambient light source for all glass panels above them. These are purely decorative and must be placed on a fixed `z-index: 0` pseudo-element layer behind all content.

**Light Mode Blob Configuration:**
```css
/* Blob 1 — Navy accent glow, top-left */
background: radial-gradient(ellipse 900px 700px at 15% 10%,
  rgba(30, 58, 95, 0.12) 0%,
  transparent 70%);

/* Blob 2 — Warm neutral glow, bottom-right */
background: radial-gradient(ellipse 700px 600px at 85% 90%,
  rgba(44, 79, 124, 0.08) 0%,
  transparent 65%);

/* Blob 3 — Soft blue-white highlight, center-top */
background: radial-gradient(ellipse 500px 400px at 50% -10%,
  rgba(255, 255, 255, 0.90) 0%,
  transparent 60%);
```

**Dark Mode Blob Configuration:**
```css
/* Blob 1 — Deep navy aurora, top-left */
background: radial-gradient(ellipse 900px 700px at 10% 5%,
  rgba(44, 79, 124, 0.22) 0%,
  transparent 70%);

/* Blob 2 — Purple-blue glow, bottom-right */
background: radial-gradient(ellipse 700px 600px at 90% 95%,
  rgba(79, 70, 229, 0.15) 0%,
  transparent 65%);

/* Blob 3 — Teal accent, center-right */
background: radial-gradient(ellipse 500px 500px at 100% 40%,
  rgba(6, 182, 212, 0.08) 0%,
  transparent 60%);
```

### 5.2 Base Canvas Background

```css
/* Light Mode canvas */
[data-theme="light"] body {
  background-color: #EEF2F7;
}

/* Dark Mode canvas */
[data-theme="dark"] body {
  background-color: #0E0E12;
}
```

---

## 6. Component Adaptations

### 6.1 Navigation Sidebar

The sidebar becomes a tall, vertically oriented frosted-glass panel that bleeds ambient glow from the background canvas through its semi-transparent body.

```css
.app-sidebar {
  background: var(--bg-primary);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--glass-border);
  box-shadow: 4px 0 24px var(--glass-shadow);
}
```

**Navigation Item States:**
* **Active:** Semi-transparent navy glass highlight row (`--accent-navy-light`) with a 3px solid left border in `--accent-navy-primary`. Text bolded.
* **Hover:** A lighter `rgba(255,255,255,0.15)` glass wash on the row — smooth 0.25s ease transition.
* **Inactive:** Neutral text, fully transparent background — recedes into the glass surface.

### 6.2 Application Header Bar

The header bar becomes a thin, fixed glass strip — maximally transparent to allow full visibility of content scrolling beneath, while maintaining structural presence:

```css
.app-header {
  background: var(--bg-secondary);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-neutral);
  box-shadow: 0 1px 12px var(--glass-shadow);
}
```

### 6.3 Dashboard & Content Cards (`.widget-card`)

The primary glassmorphism treatment for all content panels:

```css
.widget-card {
  background: var(--glass-surface);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow:
    0 4px 24px var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.70);
  transition: box-shadow 0.3s ease, transform 0.3s ease, background 0.3s ease;
}

.widget-card:hover {
  box-shadow:
    0 8px 40px var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.90);
  transform: translateY(-2px);
}
```

### 6.4 Form Inputs & Toggles

Inputs adopt a slightly deeper translucency to differentiate them from the card surface beneath, and a high-contrast focus ring:

```css
input, select, textarea {
  background: var(--bg-tertiary);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-neutral);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--accent-navy-primary);
  box-shadow:
    0 0 0 3px rgba(30, 58, 95, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.50);
}
```

### 6.5 Primary Action Buttons

Buttons must function as high-contrast, vibrant cuts through the frosted layout — solid, opaque, and authoritative against the blurred glass environment:

```css
/* Primary CTA — solid, opaque, navy */
.btn-primary {
  background: var(--accent-navy-primary);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-md);
  box-shadow:
    0 4px 14px rgba(30, 58, 95, 0.30),
    inset 0 1px 0 rgba(255, 255, 255, 0.20);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--accent-navy-secondary);
  box-shadow:
    0 6px 20px rgba(30, 58, 95, 0.40),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* Glass Ghost Button — secondary actions */
.btn-ghost {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.60);
}
```

### 6.6 Status Pill Badges

Pill badges must remain strongly legible through glass panel stacking — use a semi-opaque pill fill that punches through the blur:

```css
.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.pill-badge.status-success {
  background: rgba(21, 128, 61, 0.15);
  color: #15803D;
  border: 1px solid rgba(21, 128, 61, 0.25);
}
/* Repeat pattern for warning, danger, info */
```

### 6.7 Floating Modals & Drawers

Modal sheets use the highest blur and the most opaque glass surface in the system — they are the foreground-most visible layer:

```css
.modal-panel {
  background: var(--glass-surface);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.20),
    0 4px 16px rgba(0, 0, 0, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.80);
}
```

### 6.8 Tooltip & Data Pill Overlays

Floating tooltips and chart data pills use an ultra-translucent glass style so they layer cleanly over any content beneath them without obstructing context:

```css
.tooltip {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.80);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 10px;
}

[data-theme="dark"] .tooltip {
  background: rgba(20, 20, 28, 0.80);
  border-color: rgba(255, 255, 255, 0.12);
}
```

---

## 7. Typography & Scale

Retained from the original system. The glassmorphism layer does not alter the typographic hierarchy — only the surface on which text is rendered changes.

| Typography Role | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `32px` | `700` | `40px` | Root view title. |
| **Section Title** | `24px` | `600` | `30px` | Major component blocks. |
| **Card Title** | `18px` | `600` | `24px` | Dashboard widget headings. |
| **Body Text** | `14px` | `400` | `21px` | Standard body prose. |
| **Data Numbers** | `14px` | `600` | `21px` | Numerical table outputs. |
| **Small Text** | `12px` | `400` | `18px` | Timestamps, metadata. |

**Note on glass legibility:** On glass surfaces, ensure a minimum contrast ratio of **4.5:1** between `--text-primary` and the rendered glass panel background tone. Where ambient glow is intense, increase text weight one step (400 → 500, 600 → 700) to compensate.

---

## 8. Layout, Spacing & Grid System

Retained from the original system with the following glass-specific additions.

### 8.1 Spacing Scale
`4px · 8px · 16px · 24px · 32px · 48px · 64px`

### 8.2 Max-Width Constraints
* **Dashboard Layouts:** `1600px`
* **Settings:** `1200px`
* **Forms & Data Entry:** `800px`

### 8.3 Card Elevation Tiers

Glass cards exist in one of four elevation tiers. Higher tiers have more blur, more opacity, stronger shadow, and slightly larger border-radius:

| Tier | blur | bg-alpha | box-shadow spread | radius |
| :--- | :--- | :--- | :--- | :--- |
| **0 — Canvas** | `0px` | Raw background | None | — |
| **1 — Background panel** | `16px` | `0.40` | `12px` | `--radius-lg` |
| **2 — Standard card** | `24px` | `0.55` | `24px` | `--radius-lg` |
| **3 — Foreground/floating** | `32px` | `0.70` | `40px` | `--radius-xl` |
| **4 — Modal/overlay** | `40px` | `0.85` | `60px` | `--radius-xl` |

---

## 9. Animation & Motion Blueprint

Motion in the glassmorphism system must feel as though panels and surfaces are physically shifting, rising, or diffusing:

| Interaction | Duration | Easing | Effect |
| :--- | :--- | :--- | :--- |
| Page / view transition | `200ms` | `ease` | Opacity fade + 4px Y translate |
| Card hover lift | `300ms` | `ease` | `translateY(-2px)` + shadow intensify |
| Drawer slide-in | `300ms` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Edge slide + blur intensify |
| Modal fade-in | `250ms` | `ease-out` | Opacity + scale from `0.97` → `1` |
| Button press | `150ms` | `ease` | `translateY(1px)` + shadow shrink |
| Hover state | `250ms` | `ease` | Background opacity + border brightness shift |
| Form focus ring | `200ms` | `ease` | Box-shadow grow |

**Global shorthand:**
```css
/* Universal smooth transition for glass interactive elements */
transition: all 0.3s ease;
```

---

## 10. Desktop Component Architecture

### 10.1 Navigation Sidebar (Glass Rail)
* **Expanded Width:** `260px` — full labels visible.
* **Collapsed Width:** `72px` — icon-only compact mode.
* **Material:** Tier 1 glass panel, 20px blur, navy ambient glow behind it.
* **Active Item:** Navy glass highlight row + 3px left border in `--accent-navy-primary`.

### 10.2 Executive Dashboard
The frosted glass surface amplifies the executive-scan experience. Ambient blobs behind the canvas illuminate widget cards from below, making summary metrics feel physically present.

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Tasks Needing Attention]  [Overdue]  [Pending Approvals]  [Done]   │  ← Tier 2 stat cards
├──────────────────────────────────────────────────────────────────────┤
│      [Team Workload Analytics]          │  [Departmental Activity]   │  ← Tier 2 chart cards
├──────────────────────────────────────────────────────────────────────┤
│       [Recent Task Activity]            │  [Notification Matrix]     │  ← Tier 2 list cards
└──────────────────────────────────────────────────────────────────────┘
```

* Widget cards: Tier 2 glass surface with 24px blur.
* Charts: Smooth SVG vector paths with subtle `--accent-glow` colored glows on data lines.
* Floating chart tooltips: Tier 4 glass pills.

### 10.3 Task Workspace — Split-Pane Engine
* **Left Panel:** Glass card — filterable task list. Tier 2.
* **Right Panel:** Glass card — task context, threads, actions. Tier 2.
* Selected task row: Active row uses `--accent-navy-light` glass wash.

### 10.4 Organizational Hierarchy Chart
Interactive org tree rendered on a glass background panel (Tier 1). Node boxes are Tier 2 glass cards with specular edges. Connector lines are semi-transparent navy strokes (`rgba(30, 58, 95, 0.35)`).

### 10.5 Data Tables
Tables are hosted inside Tier 2 glass cards. Table rows have minimal, translucent hover states:
```css
tr:hover td {
  background: rgba(255, 255, 255, 0.15);
  transition: background 0.2s ease;
}
```
Sticky headers: slightly higher opacity glass surface than the row body to create a subtle depth separation during scroll.

---

## 11. Mobile Interface & Touch Specifications

The glassmorphism aesthetic adapts fully to mobile — frosted panels stack vertically on a gradient canvas. All backdrop blurs remain active.

### 11.1 Layout & Spacing
* **Page Margin:** `16px`
* **Card Padding:** `16px`
* **Touch Targets:** Minimum `44px × 44px`

### 11.2 Core Navigation Realignment
* **Bottom Tab Bar:** Fixed glass strip at the bottom. `blur(24px)`, `border-top: 1px solid var(--glass-border)`.
* **Global Quick Action Button:** Centered floating glass button, Tier 3 elevation, subtle navy glow.
* **Utility Overflow Drawer:** Full-screen Tier 4 glass sheet that slides up from the bottom edge.

### 11.3 Mobile View Adaptations
* **Dashboard Widgets:** Stack vertically. The top stat row becomes a horizontal swipeable strip of Tier 2 glass cards.
* **Task Detail:** Slides up as a Tier 4 glass sheet covering `92%` of viewport height.
* **Org Chart:** Collapses to an accordion-driven vertical list on glass cards.
* **Data Tables → Glass Summary Cards:** Complex rows collapse to high-density card items with a tap-to-expand glass popover for row actions.

### 11.4 Native Touch Gestures
* **Swipe-to-Complete:** Swipe right → task complete (`status-success` glass flash).
* **Swipe-to-Menu:** Swipe left → glass utility panel for Reassign / Flag.
* **Pull-to-Refresh:** Dashboard and Tasks — subtle frosted spinner micro-animation.

---

## 12. Implementation Checklist

The following items must be verified before any view is considered design-complete:

- [ ] All `background-color` uses are replaced with `rgba()` translucent tokens.
- [ ] `backdrop-filter: blur()` is applied at the correct tier intensity.
- [ ] `border: 1px solid var(--glass-border)` is present on every glass panel.
- [ ] `box-shadow` includes both the outer depth shadow and the `inset 0 1px 0` specular highlight.
- [ ] `border-radius` uses the appropriate `--radius-*` token (no hardcoded values).
- [ ] All `transition` rules use `transition: all 0.3s ease` or the specified per-interaction values.
- [ ] Both `[data-theme="light"]` and `[data-theme="dark"]` are tested — no token breaks.
- [ ] Text contrast passes 4.5:1 ratio against the rendered glass surface in both themes.
- [ ] Ambient background blobs are visible and illuminating the glass panels from behind.
- [ ] Modals and drawers use the highest blur tier (`blur(40px)`) and largest `border-radius`.
