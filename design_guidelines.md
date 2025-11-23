# Design Guidelines: Marketplace Review & Complaint Manager

## Design Approach

**Reference-Based Approach**: Drawing inspiration from modern SaaS productivity tools:
- **Linear**: Clean, minimal dashboard aesthetics with excellent data density
- **Notion**: Flexible card-based layouts and content organization
- **Asana/Monday.com**: Kanban board patterns and workflow visualization
- **Mixpanel/Amplitude**: Dashboard analytics and data visualization patterns

**Core Principle**: Create a professional, information-dense interface that prioritizes clarity, scannability, and efficient workflow management over visual decoration.

---

## Typography

**Font Stack**: 
- Primary: Inter (Google Fonts) for UI elements, buttons, labels
- Secondary: System-ui fallback for data/numbers
- Monospace: JetBrains Mono for metadata, timestamps

**Type Scale**:
- Page titles: text-2xl font-semibold
- Section headers: text-lg font-semibold  
- Card titles: text-base font-medium
- Body text: text-sm
- Metadata/labels: text-xs font-medium uppercase tracking-wide
- Stats/numbers: text-3xl font-bold

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** consistently
- Component padding: p-4 or p-6
- Section gaps: gap-6 or gap-8
- Card spacing: space-y-4
- Tight groupings: gap-2

**Dashboard Structure**:
- Fixed sidebar (w-64) with navigation
- Main content area (flex-1) with max-w-7xl container
- Top bar with user info, theme toggle, search (h-16)
- Content uses full available height (h-screen with overflow management)

---

## Component Library

### Navigation Sidebar
- Fixed left sidebar with marketplace source filters
- Logo/app name at top
- Navigation items with icons (Heroicons) and labels
- Active state with subtle indicator
- Collapsible sections for filter groups
- Bottom area for user profile and settings

### Dashboard Header
- Page title with review count badge
- Primary action button (top-right): "Load Demo Data" / "Import Reviews"
- Secondary actions: Filter toggles, date range picker, view options
- Search bar with icon (w-96)

### Review Cards
- Card container: rounded-lg border with subtle shadow on hover
- Header row: Marketplace logo/badge, timestamp (text-xs), severity badge
- Review title/summary: text-base font-medium, truncate at 2 lines
- Sentiment indicator: Icon + label (positive/negative/neutral)
- Category tags: Multiple small badges with issue types
- Rating display: Stars or numeric (if applicable)
- Preview text: text-sm with 3-line truncation
- Footer actions: "View Details", "Generate Reply", status dropdown
- Expandable on click to full modal view

### Kanban Board
- Three columns: "Open", "In Progress", "Resolved"
- Column headers with count badges
- Drag-and-drop enabled cards
- Cards show condensed review info: source, title, severity, assignee avatar
- Empty state illustrations for empty columns
- Column max-width to prevent excessive stretching

### Analytics Section
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for stat cards
- Stat cards: rounded-lg border, p-6, with icon, large number, label, trend indicator
- Chart containers: Full-width or grid-cols-2 for side-by-side comparisons
- Chart.js integration: Line charts for trends, bar charts for categories, pie/donut for distribution
- Legend placement below charts

### Review Detail Modal
- Full overlay with max-w-3xl centered container
- Modal header: Marketplace badge, review title, close button
- Tabbed sections: "Details", "AI Analysis", "Response"
- Full review content display with proper formatting
- AI-generated insights in structured format with bullet points
- Response textarea with AI-suggested text pre-filled
- Action buttons: "Save Draft", "Send Reply", "Mark Resolved"

### Filter Panel
- Collapsible sidebar or dropdown
- Checkbox groups for: Marketplaces, Sentiment, Severity, Status
- Date range picker with presets
- Clear all filters button
- Active filter chips displayed below header

### Forms & Inputs
- Input fields: rounded-md border, p-3, focus:ring-2
- Labels: text-sm font-medium mb-2
- Textareas: min-h-32 for reply composition
- Select dropdowns: Chevron icon, full-width
- File upload: Dashed border dropzone with icon and helper text

### Badges & Tags
- Small rounded badges: px-2.5 py-0.5 text-xs font-medium rounded-full
- Severity levels: Distinct visual weights (not colors - structure only)
- Status indicators: Outlined style for workflow states
- Source logos: Small icon badges (h-5 w-5)

### Buttons
- Primary: px-4 py-2 rounded-md font-medium
- Secondary: border variant
- Icon buttons: p-2 rounded-md with single icon
- Button groups: Adjacent buttons with border-radius adjustment

### Empty States
- Centered content with icon, heading, description
- "No reviews found" with illustration placeholder
- "Upload data" call-to-action

---

## Page Layouts

### Login Screen
- Centered card (max-w-md) on full-screen page
- Logo at top
- Form fields for demo credentials
- Single "Sign In" button
- Minimal, clean presentation

### Main Dashboard View
- Sidebar + main content two-column layout
- Stats row at top (4 stat cards)
- Filter bar below stats
- Review grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with masonry-style cards
- Pagination or infinite scroll

### Kanban View
- Full-width board layout
- Three equal-width columns with gap-6
- Vertical scrolling within columns
- Floating "Add Review" button

### Analytics View
- Two-column grid for charts
- Full-width summary stats at top
- Chart cards with titles and export options
- Time range selector in header

---

## Animations

**Minimal Motion**:
- Card hover: Subtle shadow transition (transition-shadow duration-200)
- Modal open/close: Fade + scale (scale-95 to scale-100)
- Drag-and-drop: Visual feedback on grab and drop zones
- Loading states: Simple spinner or skeleton screens
- NO scroll-triggered animations
- NO page transition effects

---

## Accessibility

- Keyboard navigation for all interactive elements
- Focus states with ring-2 on all inputs and buttons
- Aria labels for icon-only buttons
- Semantic HTML throughout (nav, main, article, aside)
- Color-independent status indicators (use icons + text labels)
- Minimum touch target: 44×44px

---

## Images

**No Hero Image**: This is a dashboard application, not a marketing site

**Asset Usage**:
- Marketplace logos: Small icons for Amazon, eBay, Shopify, etc. (use placeholder or Font Awesome brand icons)
- Empty state illustrations: Simple line-art style placeholders
- User avatars: Circular placeholders with initials
- Chart placeholders: Use Chart.js with sample data
- Icon library: Heroicons throughout (outline style for secondary actions, solid for primary)

---

## Responsive Behavior

- Mobile (< 768px): Sidebar collapses to hamburger menu, single column card grid, stacked stats
- Tablet (768-1024px): Two-column grids, compact sidebar
- Desktop (> 1024px): Full three-column layouts, expanded sidebar, maximum information density