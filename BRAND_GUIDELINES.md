# DripCatch Brand & UI Guidelines

> **Status:** Draft / Bootstrap  
> **Scope:** Ledger, Analytics Charts, Split Flows, Notifications, Auth & Modals  
> **Note:** Adapted to the custom 5-color brand palette (`#1C2421`, `#C8C1C9`, `#F7F5F7`, `#FF385C`, `#2B7A78`) mapped onto Tailwind CSS utility conventions.

---

## 1. Color Palette & Semantic Tokens

DripCatch uses a custom 5-color core identity paired with functional semantic tokens for financial states and data visualization.

### Core Brand Palette
| Token Role | Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | Coral-Pink | `#FF385C` | Primary CTAs, active navigation indicators, high-priority actions |
| **Brand Secondary** | Deep Teal | `#2B7A78` | Secondary actions, positive net savings, links, active filters |
| **Dark Base** | Deep Charcoal | `#1C2421` | Light-mode primary typography; Dark-mode primary canvas |
| **Light Base** | Crisp Off-White | `#F7F5F7` | Light-mode app canvas; Dark-mode primary typography |
| **Neutral Accent** | Lavender-Gray | `#C8C1C9` | Structural borders, dividers, muted surfaces, inactive states |

### Surfaces & Neutrals (Light / Dark Mode)
| Semantic Role | Light Mode | Dark Mode | Notes |
| :--- | :--- | :--- | :--- |
| **App Canvas** | `bg-[#F7F5F7]` | `bg-[#1C2421]` | Main viewport background |
| **Elevated Cards / Modals / Toasts** | `bg-white` | `bg-[#242E2A]` *(or `bg-zinc-900`)* | Slightly lifted surface from canvas |
| **Subtle Borders** | `border-[#C8C1C9]/60` | `border-[#C8C1C9]/15` | 1px crisp structural dividers |
| **Text: Primary** | `text-[#1C2421]` | `text-[#F7F5F7]` | Headings, primary ledger items (~14.5:1 contrast) |
| **Text: Secondary** | `text-[#1C2421]/70` | `text-[#C8C1C9]` | Subtitles, table headers, metadata |
| **Text: Muted** | `text-[#1C2421]/45` | `text-[#C8C1C9]/50` | Placeholders, disabled labels, timestamps |

### Interactive & Brand Accents
* **Primary CTA (`#FF385C`):**
  * Base: `bg-[#FF385C] text-white`
  * Hover: `hover:bg-[#E02849]` (Light) / `hover:bg-[#FF5271]` (Dark)
* **Secondary Action / Positive Savings (`#2B7A78`):**
  * Base: `bg-[#2B7A78] text-white`
  * Hover: `hover:bg-[#226260]` (Light) / `hover:bg-[#369693]` (Dark)

### Semantic Status Colors
Use subtle tinted fills (`bg-<color>/10`) paired with crisp borders (`border-<color>/20`) for badges and status indicators.

| Status | Color | Hex | Tailwind Token Pattern |
| :--- | :--- | :--- | :--- |
| **Success / Accepted Split / Net Savings** | Deep Teal | `#2B7A78` | `text-[#2B7A78] bg-[#2B7A78]/10 border-[#2B7A78]/20` |
| **Info / Shared With You** | Sky | `#0EA5E9` | `text-sky-500 bg-sky-500/10 border-sky-500/20` |
| **Warning / Zombie Sub / Pending Split** | Amber | `#F59E0B` | `text-amber-500 bg-amber-500/10 border-amber-500/20` |
| **Danger / Price Hike / Rejected / Delete** | Coral-Pink | `#FF385C` | `text-[#FF385C] bg-[#FF385C]/10 border-[#FF385C]/20` |

### Data Visualization Palette
Ordered chart sequence designed to harmonize with `#2B7A78` and `#FF385C`:
1. `#2B7A78` *(Deep Teal — Primary series)*
2. `#FF385C` *(Coral-Pink — Highlight / Spend series)*
3. `#0EA5E9` *(Sky Blue)*
4. `#8B5CF6` *(Violet)*
5. `#F59E0B` *(Amber)*
6. `#06B6D4` *(Cyan)*
7. `#C8C1C9` *(Lavender-Gray — Other / Baseline)*

---

## 2. Typography & Financial Formatting

* **UI Sans:** Use the default system sans-serif stack (`font-sans`) for all headings, navigation, labels, and body copy.
* **Financial & Temporal Data:** Apply `font-mono tabular-nums` to **all** currency amounts, percentages, subscription counts, and ISO dates (`YYYY-MM-DD`) to guarantee vertical alignment in ledger tables and split breakdowns.
  ```tsx
  <span className="font-mono tabular-nums text-[#1C2421] dark:text-[#F7F5F7]">
    {formatCurrency(amount)}
  </span>
