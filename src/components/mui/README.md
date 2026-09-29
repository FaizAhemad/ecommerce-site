# Gadgify MUI component system

All application-owned MUI theme, provider, exports, component stories and component tests belong in this folder. Use the exports from `index.ts` and `gadgifyTheme`; avoid direct MUI imports in feature code except for specialized icons and types. New features should use this system rather than add Tailwind or shadcn components.

Every component exported by `index.ts` has its own `.tsx` wrapper file in this folder. Wrappers retain the underlying MUI props and behavior while applying Gadgify-specific color, focus, spacing, surface, responsive or state styles. `Box` keeps its polymorphic `component` prop; the X Community DataGrid wrapper preserves server-side operation support. The core `Button`, `Checkbox`, `Radio`, `Skeleton` and `Backdrop` wrappers add the most visible brand-specific behavior and accessibility defaults.

## Component catalog

The centralized exports include the MUI Material components used across Gadgify:

- Actions: `Button`, `ButtonGroup`, `IconButton`, `Link`, `Menu`, `MenuItem`, `Tooltip`.
- Inputs: `Autocomplete`, `Checkbox`, `FormControl`, `FormControlLabel`, `FormHelperText`, `FormLabel`, `InputAdornment`, `InputLabel`, `Radio`, `RadioGroup`, `Select`, `Switch`, `TextField`.
- Data display: `Accordion`, `AccordionDetails`, `AccordionSummary`, `Avatar`, `Badge`, `Breadcrumbs`, `Card`, `CardActions`, `CardContent`, `CardHeader`, `Chip`, `Divider`, `Paper`, `Stack`, `Table`, `TableBody`, `TableCell`, `TableContainer`, `TableHead`, `TablePagination`, `TableRow`, `TableSortLabel`, `Typography`.
- Feedback and loading: `Alert`, `AlertTitle`, `CircularProgress`, `LinearProgress`, `Skeleton`, `Snackbar`.
- Navigation: `Container`, `Pagination`, `Tab`, `Tabs`.
- Overlays: `Backdrop`, `Dialog`, `DialogActions`, `DialogContent`, `DialogTitle`, `Drawer`.
- Application server grid: `../DataGrid.tsx`, composed from shared MUI Table, TableSortLabel, TextField and TablePagination. The separate MUI X Community wrapper is available for its MIT feature set; it is not the current application grid.

## Stories and tests

Stories and interaction tests live beside the shared system and are discovered/configured by `.storybook/main.ts` and `vitest.config.ts`. The action, form, surface/feedback, loading/navigation, overlay and Community Data Grid stories cover primary, secondary, destructive, pending, invalid, empty/loading, semantic feedback, record cards, interactive overlays, server data display and navigation examples. The catalog has wrappers for all exported components; story coverage is being expanded to match the full component inventory and their states.

## Application migration map

This list maps existing Gadgify components to the MUI primitives they should use as each migration batch is completed. It is an implementation inventory, not a claim that all consumers have migrated.

| Existing component | MUI system target |
| --- | --- |
| `SiteLayout`, `PageContainer`, `SellerNavigation` | `Container`, `Box`, `Stack`, `AppBar`, `Toolbar`, `Tabs`, `Button`, `IconButton`, `Badge` |
| `ProductCard`, `ProductGrid`, `PromoCarousel`, `AddToCartButton`, `RatingStars` | `Card`, `CardContent`, `CardActions`, `Button`, `ButtonGroup`, `IconButton`, `Chip`, `Rating`, `Skeleton`, `Stack` |
| `DataGrid` | Shared MUI Table composition, server-side pagination/sort/filter, retained rows during refresh, body-only progress indicator |
| `FormDialog`, `ProfileForms`, `CheckoutSubmit`, `CheckoutSettings`, `CouponManager`, `PolicyEditor` | `Dialog`, `Drawer`, `TextField`, `Select`, `FormControl`, `Checkbox`, `RadioGroup`, `Switch`, `Button`, `Alert` |
| `FilterSidebar` | `Drawer`, `Button`, `Checkbox`, `FormControl`, `Select`, `Typography` (drawer now migrated) |
| `NotificationProvider`, `ConnectionStatus`, `NotificationHistory` | `Snackbar`, `Alert`, `Badge`, `Chip`, `Stack` |
| `OrderTotals`, `OrderTimeline`, `OrderPayment`, `ShipmentManager`, `ReturnRequests`, `CustomerReturns` | `Paper`, `Card`, `Stack`, `Chip`, `Timeline` replacement built from `Stepper`, `Step`, `StepLabel`, `Alert`, `Button` |
| `ImagePreviewDialog`, `SupportAttachments`, `SellerMediaLibrary` | `Dialog`, `DialogContent`, `IconButton`, `Button`, `Card`, `LinearProgress`, `Alert` |
| `SupportTicketCard`, `SupportConversation`, `CustomerMessages`, `PurchaseFeedback` | `Card`, `TextField`, `Button`, `Chip`, `Alert`, `Stack`, `Avatar` |
| `SiteTour`, `SessionActivity` | `Dialog`, `Popover`, `Tooltip`, `Button`, `LinearProgress`, `Alert` |

Tailwind utility styling remains in unconverted feature code until all listed consumers are migrated and verified. The Products filter drawer has already moved to MUI. Remove Tailwind build integration only in the final migration batch after a source scan confirms there are no remaining consumers.

## Shared component foundation - 2026-09-30

The theme now uses white surfaces, a cool neutral canvas, teal primary actions and semantic feedback colors. Controls use 44px compact / 48px regular touch targets, 16px input text, visible keyboard focus, and consistent borders/spacing. Button, IconButton, Checkbox, Radio, Switch and Chip preserve MUI semantic colors; TextField and Select preserve error and disabled borders. Existing legacy page styles still require consumer migration.

The application grid uses labelled text/number/select fields immediately below headers, visible All select placeholders, right-aligned search, conditional Clear filters, TableSortLabel and TablePagination. Filtering/search is debounced into the existing server query contract; no client-side filtering or invented operator support is added. Pagination has one page-size label and range, first/previous/next/last actions and a bounded page-jump input. Refresh retains supplied rows, with measured body-only spinner placement instead of skeletons or fixed offsets over filters. Callers must retain rows/counts during fetching and continue managing mutation locks and errors.

MUI X header filters and simultaneous multi-column filtering require Pro; this composition preserves those application requirements without introducing a paid dependency. References: [MUI filtering](https://mui.com/x/react-data-grid/filtering/), [MUI Table](https://mui.com/material-ui/react-table/), [TablePagination](https://mui.com/material-ui/api/table-pagination/) and [theme components](https://mui.com/material-ui/customization/theme-components/).

`shared-grid.stories.tsx` demonstrates the actual application grid (default, refreshing, initial loading, empty, 1,200 pages and phone width). It emits query fixtures and does not save edits or fetch data. The older `data-grid.stories.tsx` demonstrates the separate X Community wrapper. Interaction tests cover combined server filter/search/sort, page-size reset, direct jumps, accessible controls and retained rows. Rendered/device and all-component state coverage remain pending.
