# AGENTS.md

## Repository Context

This repository contains:
1. **AI Focus Guard** - A Chrome Extension (Manifest V3) for blocking distracting content
2. **Design Specifications** - Stripi brand design system documentation

## Chrome Extension: AI Focus Guard

### Key Files
- `manifest.json` - Manifest V3 configuration
- `config.js` - API keys (NewsAPI) and constants
- `src/background/service-worker.js` - Background service worker
- `src/content/blocker.js` - Main content blocker orchestrator
- `src/popup/popup.html` - Extension popup UI
- `src/pages/research.html` - Research dashboard page

### Development Commands
- **Load Extension**: `chrome://extensions/` → Developer mode → Load unpacked
- **Generate Icons**: Open `generate-icons.html` in browser, save PNGs to `assets/icons/`

### Architecture
- Content scripts detect and block YouTube Shorts, Instagram Reels, Facebook Reels, TikTok
- Service worker handles settings, statistics, and messaging
- Research page fetches AI news from NewsAPI.org
- All state persisted via Chrome Storage API

## Design Specifications

### Key Files
- **DESIGN.md**: Complete design system (colors, typography, components, layout)
- **SKILL.md**: UI review skill for checking code against Web Interface Guidelines
- **opencode.json**: Configures shadcn MCP server for component generation

## Critical Conventions

### Design System Tokens
- All design values use token references: `{colors.primary}`, `{typography.display-xxl}`, `{rounded.pill}`
- **Never** use raw hex values or pixel sizes when tokens exist
- Display typography: weight 300 (thin) with negative letter-spacing is mandatory
- Money/numeric cells require `font-feature-settings: "tnum"`
- Buttons are pill-shaped (`rounded.pill` = 9999px) with tight `8px 16px` padding

### Design System Tokens
- All design values use token references: `{colors.primary}`, `{typography.display-xxl}`, `{rounded.pill}`
- **Never** use raw hex values or pixel sizes when tokens exist
- Display typography: weight 300 (thin) with negative letter-spacing is mandatory
- Money/numeric cells require `font-feature-settings: "tnum"`
- Buttons are pill-shaped (`rounded.pill` = 9999px) with tight `8px 16px` padding

### Brand Non-Negotiables
- Gradient mesh on all marketing heroes (cream → orange → lavender → indigo → ruby)
- Single indigo CTA per band (`{colors.primary}` = `#533afd`)
- Sohne font family (or Inter as open-source substitute)
- `font-feature-settings: "ss01"` applied globally on body element

### Design Tokens Hierarchy
```
colors.* → visual identity
typography.* → text styling (weight 300 for display, 400 for buttons)
spacing.* → layout (base unit: 8px)
rounded.* → shapes (pill for buttons, lg for cards)
components.* → pre-composed UI patterns
```

## Working with This Repo

### When Modifying Design Specs
1. Always reference token names, not raw values
2. Add new variants as separate component entries
3. Run `npx @google/design.md lint DESIGN.md` after edits
4. Default body text: `{typography.body-md}` (15px)
5. Money cells: `{typography.body-tabular}` with `tnum`

### When Reviewing UI Code
Use the `web-design-guidelines` skill:
- Fetches fresh guidelines from Vercel's repository
- Checks against all Web Interface Guidelines rules
- Outputs findings in `file:line` format

### When Generating Components
The shadcn MCP server is configured for component generation. Use standard shadcn patterns but apply Stripi design tokens.

## Common Pitfalls

- **Don't** bump display weight above 300 (breaks brand identity)
- **Don't** use indigo as body text color (it's CTA-only)
- **Don't** skip `tnum` on financial data (breaks brand signature)
- **Don't** use CSS gradients for mesh (requires SVG/image implementation)
- **Don't** shrink button padding below `8px 16px`

## No Build System

This repo has no:
- Package.json or dependencies
- Build/test/lint commands
- CI/CD workflows
- Source code to compile

All work is document-based design specification.