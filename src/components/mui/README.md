# Gadgify MUI component system

All application-owned MUI theme, provider, exports, component stories and component tests belong in this folder. Use the exports from `index.ts` and `gadgifyTheme`; avoid direct MUI imports in feature code except for specialized icons and types. New features should use this system rather than add Tailwind or shadcn components.

Every component exported by `index.ts` has its own `.tsx` wrapper file in this folder. Wrappers retain the underlying MUI props and behavior while applying Gadgify-specific color, focus, spacing, surface, responsive or state styles. `Box` keeps its polymorphic `component` prop; the X Community DataGrid wrapper preserves server-side operation support. The core `Button`, `Checkbox`, `Radio`, `Skeleton` and `Backdrop` wrappers add the most visible brand-specific behavior and accessibility defaults.

## Component catalog

The centralized exports include the MUI Material components used across Gadgify:

- Actions: `Button`, `ButtonGroup`, `IconButton`, `Link`, `Menu`, `MenuItem`, `Tooltip`.
- Inputs: `Autocomplete`, `Checkbox`, `FormControl`, `FormControlLabel`, `FormHelperText`, `FormLabel`, `InputAdornment`, `InputLabel`, `Radio`, `RadioGroup`, `Select`, `Switch`, `TextField`.
- Data display: `Accordion`, `AccordionDetails`, `AccordionSummary`, `Avatar`, `Badge`, `Breadcrumbs`, `Card`, `CardActions`, `CardContent`, `CardHeader`, `Chip`, `Divider`, `Paper`, `Stack`, `Table`, `TableBody`, `TableCell`, `TableContainer`, `TableHead`, `TablePagination`, `TableRow`, `Typography`.
- Feedback and loading: `Alert`, `AlertTitle`, `CircularProgress`, `LinearProgress`, `Skeleton`, `Snackbar`.
- Navigation: `Container`, `Pagination`, `Tab`, `Tabs`.
- Overlays: `Backdrop`, `Dialog`, `DialogActions`, `DialogContent`, `DialogTitle`, `Drawer`.
- Server data grid: MUI X Community `DataGrid`, currently used under its free MIT feature set.

## Stories and tests

Stories and interaction tests live beside the shared system and are discovered/configured by `.storybook/main.ts` and `vitest.config.ts`. The action, form, surface/feedback, loading/navigation, overlay and Community Data Grid stories cover primary, secondary, destructive, pending, invalid, empty/loading, semantic feedback, record cards, interactive overlays, server data display and navigation examples. The catalog has wrappers for all exported components; story coverage is being expanded to match the full component inventory and their states.

## Application migration map

This list maps existing Gadgify components to the MUI primitives they should use as each migration batch is completed. It is an implementation inventory, not a claim that all consumers have migrated.

| Existing component | MUI system target |
| --- | --- |
| `SiteLayout`, `PageContainer`, `SellerNavigation` | `Container`, `Box`, `Stack`, `AppBar`, `Toolbar`, `Tabs`, `Button`, `IconButton`, `Badge` |
| `ProductCard`, `ProductGrid`, `PromoCarousel`, `AddToCartButton`, `RatingStars` | `Card`, `CardContent`, `CardActions`, `Button`, `ButtonGroup`, `IconButton`, `Chip`, `Rating`, `Skeleton`, `Stack` |
| `DataGrid` | MUI X Community `DataGrid`, server-side pagination/sort/filter, retained rows during refresh, centered progress indicator |
| `FormDialog`, `ProfileForms`, `CheckoutSubmit`, `CheckoutSettings`, `CouponManager`, `PolicyEditor` | `Dialog`, `Drawer`, `TextField`, `Select`, `FormControl`, `Checkbox`, `RadioGroup`, `Switch`, `Button`, `Alert` |
| `FilterSidebar` | `Drawer`, `Button`, `Checkbox`, `FormControl`, `Select`, `Typography` (drawer now migrated) |
| `NotificationProvider`, `ConnectionStatus`, `NotificationHistory` | `Snackbar`, `Alert`, `Badge`, `Chip`, `Stack` |
| `OrderTotals`, `OrderTimeline`, `OrderPayment`, `ShipmentManager`, `ReturnRequests`, `CustomerReturns` | `Paper`, `Card`, `Stack`, `Chip`, `Timeline` replacement built from `Stepper`, `Step`, `StepLabel`, `Alert`, `Button` |
| `ImagePreviewDialog`, `SupportAttachments`, `SellerMediaLibrary` | `Dialog`, `DialogContent`, `IconButton`, `Button`, `Card`, `LinearProgress`, `Alert` |
| `SupportTicketCard`, `SupportConversation`, `CustomerMessages`, `PurchaseFeedback` | `Card`, `TextField`, `Button`, `Chip`, `Alert`, `Stack`, `Avatar` |
| `SiteTour`, `SessionActivity` | `Dialog`, `Popover`, `Tooltip`, `Button`, `LinearProgress`, `Alert` |

Tailwind utility styling remains in unconverted feature code until all listed consumers are migrated and verified. The Products filter drawer has already moved to MUI. Remove Tailwind build integration only in the final migration batch after a source scan confirms there are no remaining consumers.
