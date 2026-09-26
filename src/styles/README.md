# Styles ownership

`src/index.css` holds global defaults, tokens, focus and reduced-motion rules. `src/App.css` is only an ordered stylesheet entry point. Its feature groups were extracted without reordering rules to preserve the legacy cascade. Some cross-feature rules and older overrides still need incremental cleanup; extraction alone does not resolve them.

Edit the owning feature file rather than appending overrides to App.css. New record cards belong in record-cards.css; the shared native drawer owns components/FormDialog.css. Dialog forms reuse account/admin form classes. Keep colors and spacing tied to shared tokens, retain 44px controls, and check small screens, keyboard, focus, error feedback and pending operations before claiming acceptance.

2026-09-25: controls.css is the sole base owner for primary-button and secondary-button; feature styles may set contextual placement/width. index.css owns font/spacing/control tokens. layout-and-feedback.css owns 16/24/32px phone/tablet/desktop gutters and notification presentation; dismissal targets use the shared 44px minimum. Source changes are not rendered acceptance.

2026-09-26: Tailwind v4 utilities are enabled via the Vite plugin and imported without Preflight so the existing application baseline stays stable. Legacy feature sheets are layered below Tailwind utilities during migration. The Products route is the first Tailwind-first page; its filter drawer uses Radix Dialog primitives in the local `components/ui/sheet.tsx`, styled with Tailwind. Keep brand values on the shared CSS variables until theme tokens are migrated deliberately.
