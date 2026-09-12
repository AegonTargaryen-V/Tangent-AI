# Antigravity Project Rules & Design Guardrails

## 1. Core Visual & Aesthetic Constraints (Strict)
- Do not use purple gradient UI.
- Do not use any emojis.
- Do not use glassmorphism or any kind of morphism without explicit instruction.
- Do not use glow animations.
- Always make the website UI production ready.
- Ban decorative floating mockups: Never render tilted, skewed, or floating fake browser/app frames displaying non-functional dashboard graphics.

## 2. Text, Copy & Placeholder Rules
- Do not use fancy placeholders; use direct references (e.g., "users name") or use lorem for paragraph text.
- Enforce realistic microcopy: Ban AI marketing buzzwords (e.g., "Supercharge your workflow", "Unleash next-gen power"). Write concise, technical, and concrete domain-appropriate text.
- Forbid fake metrics: Do not insert arbitrary stats, counters, or placeholder client testimonial avatars unless explicitly bound to actual data models.

## 3. Anti-Slop & Content Standards
- Eliminate generic feature grids: Never generate the boilerplate 3-card grid with generic icons and vague marketing placeholders.
- Ban decorative placeholder icons: Use only purposeful, functional icons mapped to actual actions (e.g., standard Lucide/Heroicons). Never use floating, purely decorative abstract shapes.

## 4. Production Readiness & Code Architecture
- Implement full UI state coverage: Every interactive component must natively handle loading states, skeletons, empty/zero states, validation errors, and disabled button behaviors.
- Prohibit stubbed handlers: Never write empty or placeholder callbacks like `onClick={() => console.log('clicked')}` or `alert()`. Wire working handlers or accept typed props.
- Require accessible, functional semantics: Use real interactive and landmark elements (`<button>`, `<nav>`, `<main>`, `<input>`) instead of nested `<div>` tags with click events.
- Forbid inline styles and magic numbers: Never use arbitrary ad-hoc inline styles or arbitrary CSS values (e.g., `h-[423px]`). Rely strictly on standard theme tokens, layout grids, and typographic scales.
- Zero extraneous dependencies: Do not install external animation libraries or UI frameworks for effects that can be achieved with standard CSS or existing utility classes.