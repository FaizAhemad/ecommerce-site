# Styles ownership

`src/index.css` holds global defaults, tokens, focus and reduced-motion rules. `src/App.css` is only an ordered stylesheet entry point. Its feature groups were extracted without reordering rules to preserve the legacy cascade. Some cross-feature rules and older overrides still need incremental cleanup; extraction alone does not resolve them.

Edit the owning feature file rather than appending overrides to App.css. New record cards belong in record-cards.css; the shared native drawer owns components/FormDialog.css. Dialog forms reuse account/admin form classes. Keep colors and spacing tied to shared tokens, retain 44px controls, and check small screens, keyboard, focus, error feedback and pending operations before claiming acceptance.
