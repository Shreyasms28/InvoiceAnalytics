# QualityAnalytics Design Guidelines

## Design Approach
**Selected Approach:** Design System + Analytics Dashboard Reference

Drawing inspiration from modern analytics platforms (Linear, Vercel Dashboard, Stripe Dashboard) combined with Material Design principles for data-heavy applications. Focus on clarity, scanability, and information hierarchy.

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for SQL code display, invoice numbers)

**Hierarchy:**
- Page Titles: text-3xl, font-semibold, tracking-tight
- Section Headers: text-xl, font-semibold
- Card Titles: text-sm, font-medium, uppercase, tracking-wide
- Metric Values: text-4xl, font-bold, tabular-nums
- Body Text: text-sm, font-normal
- Table Headers: text-xs, font-medium, uppercase, tracking-wider
- SQL Code: text-sm, font-mono
- Labels: text-xs, font-medium

## Layout System

**Spacing Primitives:**
Core spacing units: 2, 4, 6, 8, 12, 16, 24 (Tailwind units)
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Card spacing: p-6
- Table cell padding: px-6 py-4
- Form element spacing: space-y-4

**Grid Structure:**
- Overview cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 with gap-6
- Chart sections: grid-cols-1 lg:grid-cols-2 with gap-6
- Sidebar: fixed width w-64, full height
- Main content: flex-1 with max-width constraints

## Component Library

### Navigation Sidebar
- Fixed left sidebar (w-64, h-screen)
- Logo/title at top (p-6)
- Navigation items as full-width buttons with icons (px-4 py-3)
- Active state: subtle background treatment, bold font
- Icon library: Heroicons (outline for inactive, solid for active)

### Overview Cards
- Container: rounded-lg border, p-6
- Layout: vertical stack with gap-2
- Label at top (text-xs, uppercase, tracking-wide, opacity-60)
- Value below (text-4xl, font-bold, tabular-nums)
- Optional trend indicator: small text with arrow icon (text-xs)

### Charts
**Container Treatment:**
- Wrapped in rounded-lg border cards with p-6
- Header with title (text-lg, font-semibold) and optional dropdown filter
- Chart canvas in fixed-height container (h-80 for primary charts, h-64 for secondary)
- maintainAspectRatio: false in Chart.js options
- Legends positioned at bottom with adequate spacing

**Chart Specifications:**
- Line Chart (Invoice Trends): Dual y-axis, curved lines, point radius 3, grid lines subtle
- Bar Chart (Vendor Spend): Horizontal orientation, bars height 24px, gap between bars
- Pie Chart (Category): Centered with percentage labels, legend to right
- Bar Chart (Cash Outflow): Vertical bars with month labels rotated 45deg

### Invoices Table
**Structure:**
- Container: rounded-lg border with overflow handling
- Search bar above table: w-full md:w-96, left-aligned with filter dropdowns to right
- Table layout: w-full with hover states on rows
- Headers: sticky top position, subtle background, border-bottom-2
- Cells: px-6 py-4 with consistent alignment (right for amounts, left for text)
- Alternating row treatment for scanability
- Status badges: inline-flex with px-2.5 py-0.5, rounded-full, text-xs
- Pagination: centered below table with page numbers and prev/next buttons

### Chat with Data Interface
**Layout:**
- Full-height flex container (min-h-screen minus header)
- Messages area: flex-1 with overflow-scroll, p-6
- Input fixed at bottom: sticky bottom-0, p-4, border-top

**Message Components:**
- User message: max-w-3xl, ml-auto, rounded-lg, p-4
- AI response: max-w-4xl, mr-auto, space-y-4
- SQL panel: rounded-md, p-4, font-mono, text-sm, max-h-64 with scroll
- Results table: full-width with same styling as invoices table, max-h-96 with scroll

**Input Area:**
- Textarea: min-h-24, resize-none, rounded-lg, p-4, border
- Send button: absolute bottom-right inside textarea (m-2)
- Loading state: animated pulse or spinner

### Buttons & Interactive Elements
**Primary Actions:**
- px-4 py-2, rounded-md, font-medium, text-sm
- Icons: 16x16px with mr-2 spacing

**Secondary Actions:**
- Ghost variant with hover state
- Icon-only buttons: p-2, rounded-md

**Dropdowns/Selects:**
- h-10, px-3, rounded-md, border, text-sm
- Chevron icon aligned right

## Key UI Patterns

**Dashboard Layout:**
- Top bar: h-16, border-bottom, flex justify-between items-center, px-6
- Content wrapper: max-w-7xl mx-auto, p-6
- Section spacing: space-y-8

**Empty States:**
- Centered content with icon (48x48px), heading, description
- Subtle background treatment
- Clear CTA button

**Loading States:**
- Skeleton screens for cards and tables
- Spinner for chart loading (centered in container)
- Inline spinners for button actions

**Responsive Behavior:**
- Sidebar: Collapsible on mobile (hamburger menu), overlay on small screens
- Cards: Stack to single column on mobile
- Charts: Maintain readability with responsive font sizes
- Table: Horizontal scroll on mobile with sticky first column

## Form Elements (Chat Input)
- Consistent height (h-10 for inputs, min-h-24 for textarea)
- Border radius: rounded-md
- Focus states: ring treatment with 2px offset
- Labels: text-sm, font-medium, mb-2
- Error states: text-xs text-red-600 below input

## Animations
**Minimal, purposeful animations only:**
- Page transitions: None (instant navigation for data app)
- Hover states: Quick transition (150ms) for backgrounds
- Loading: Subtle fade-in for content (200ms)
- Chart rendering: No animation (display immediately for data integrity)

## Icons
**Library:** Heroicons via CDN
- Use outline style as default
- Solid style for active/selected states
- Size: 20x20px for buttons/nav, 16x16px for inline, 24x24px for headings

## Accessibility
- All interactive elements have focus-visible states with ring treatment
- Tables include proper headers and scope attributes
- Forms include associated labels and aria-labels for icon buttons
- Sufficient contrast ratios for all text (WCAG AA minimum)
- Chart data also available in table format

This design creates a professional, data-focused analytics interface that prioritizes clarity and efficiency over decorative elements.