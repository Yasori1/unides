# Community Detail Page - Layout Options

This page supports two different layout options for better screen width utilization.

## Option A: Sidebar Layout (Currently Active)
- **Structure**: 2-column grid (25% sidebar / 75% main content)
- **Features**:
  - Sticky sidebar with community logo, join button, stats, and social links
  - Main content area with description and events
  - Better for content-heavy pages
- **File**: `community-detail.component.html` (lines 33-161)

## Option B: Masonry/Card Grid Layout
- **Structure**: 3-column responsive grid with distinct cards
- **Features**:
  - Card-based layout: About, Stats, Social Links, Events
  - Modern dashboard-style appearance
  - Better visual separation of information
- **File**: `community-detail-option-b.component.html`

## How to Switch Between Options

### To Use Option A (Sidebar Layout):
The current `community-detail.component.html` uses Option A. The class `layout-option-a` is applied to the content section.

### To Use Option B (Masonry/Card Grid):
1. Open `community-detail.component.html`
2. Find the content section starting at line 33
3. Replace the entire content section (from `<!-- Content Section - OPTION A: Sidebar Layout -->` to the closing `</div>` before `<!-- Not Found -->`) with the content from `community-detail-option-b.component.html` (starting from `<!-- Content Section - OPTION B: Masonry/Card Grid Layout -->`)
4. Change the class from `layout-option-a` to `layout-option-b` on the content section div

### CSS Classes
- Option A uses: `.content-section.layout-option-a`
- Option B uses: `.content-section.layout-option-b`

Both styles are already included in `community-detail.component.scss`, so no additional CSS changes are needed when switching.

## Responsive Breakpoints

Both layouts are fully responsive:
- **Desktop (>1024px)**: Full layout with all columns
- **Tablet (768px-1024px)**: Adjusted column spans
- **Mobile (<768px)**: Single column, stacked layout

