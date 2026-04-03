# Future Implementation Roadmap

This document lists features and improvements planned for future development cycles. These are **not yet implemented** in the codebase.

---

## High Priority

### 1. Cloud Backup & Sync
Currently all data lives in `localStorage` (5 MB cap, single device, wipes on browser clear).

- Integrate Firebase Firestore or Supabase as the backend store
- Sync bills, prices, inventory, and settings across devices in real time
- Show last-sync timestamp in Settings
- Offline-first: write locally, push when online (use a `syncQueue`)

### 2. Shift / Day-End Closing Report
Operators need a formal way to close a shift and hand over.

- "Close Shift" action that locks billing and generates a shift summary receipt
- Summary includes: total sales, fuel-wise breakdown, payment-mode split (Cash / Card / UPI), starting & closing stock levels
- Print or share the shift report as a PDF

### 3. Customer Credit Accounts
Some regular customers buy on credit and pay at month-end.

- Add a `Customer` entity with name, phone, credit limit
- Bills can be tagged `Credit` (on-account) in addition to Cash / Card / UPI
- Customer ledger view showing outstanding balance and payment history
- "Settle Account" action to mark credit bills as paid

### 4. WhatsApp / SMS Receipt Sharing
Instead of only printing, send the receipt digitally.

- Use the Web Share API (`navigator.share`) to share a text-format receipt via WhatsApp / SMS instantly after a bill is generated
- Fallback: copy-to-clipboard formatted receipt text
- Optional: generate a receipt image using `html2canvas` and share as an image

---

## Medium Priority

### 5. Sales Analytics Charts
The Dashboard currently only shows flat numbers. Visualize trends.

- Line chart: daily revenue over the past 30 days (use `recharts` or `chart.js`)
- Bar chart: fuel-wise sales volume comparison
- Donut chart: payment mode split (Cash vs Card vs UPI)
- Week-over-week and month-over-month % change badges on metric cards

### 6. Fuel Re-order Alerts
Admin should be notified when stock drops below a configurable threshold.

- Per-fuel configurable reorder level (e.g., alert at < 20% capacity)
- In-app banner notification when any fuel hits reorder level
- Optional: push notification via Web Push API (requires a service worker update)

### 7. Export Reports (Excel / PDF)
Management needs to share reports with accountants.

- Export filtered bill list to `.xlsx` using `SheetJS (xlsx)` library
- Export daily/monthly summary to a PDF using `jsPDF`  
- GST-formatted tax invoice PDF for B2B transactions

### 8. Multi-Pump / Multi-Nozzle Management
Currently pump & nozzle numbers are free-text. Structure them properly.

- Configure number of pumps and nozzles per pump in Settings
- Billing form shows dropdown selects instead of free-text
- Pump-wise sales breakdown in Reports
- Detect if a pump/nozzle is "busy" (has an open Draft bill) to prevent double billing

---

## Low Priority / Nice-to-Have

### 9. Staff Attendance & Wage Tracking
- Register named staff members (name, role, shift, daily wage)
- Clock-in / clock-out per shift
- Monthly wage calculation based on attendance days

### 10. Fuel Price History Log
- Store a history of every price change per fuel type with timestamp and who changed it
- View price trend chart over time in Inventory screen

### 11. Barcode / QR Scanner for Vehicle Number
- Use the device camera via `BarcodeDetector` API or a library like `zxing-js`
- Scan a vehicle's QR code or number plate (HSRP) to auto-fill vehicle number in billing

### 12. Biometric / Face Unlock
- Replace 4-digit PIN with Web Authentication API (`navigator.credentials`) for fingerprint or Face ID unlock on supported devices
- Keep PIN as a fallback

### 13. Multi-Language Support (i18n)
- Add Marathi and Hindi translations using `i18next`
- Language toggle in Settings
- RTL support not needed (both languages are LTR)

---

## Technical Debt

| Item | Detail |
|---|---|
| Replace `any` prop types | `InventoryView` and `SettingsView` use `any` for `setInventory`/`setSettings` — add proper generics |
| Remove `prompt()` calls | Settings uses browser `prompt()` to add custom items & unit conversions — replace with an inline modal form |
| `useMemo` for filtered data | `filteredBills`, `todayBills`, and chart data should be memoized to avoid re-computation on every render |
| `useCallback` for handlers | Stable refs for `addBill`, nav handlers etc. to avoid child re-renders |
| Error boundary | Wrap the app in a React `ErrorBoundary` so a crash in one component doesn't blank the whole screen |
| Automated tests | Add Vitest unit tests for `utils.ts` helpers (`convertUnit`, `safeLocalStorageGet`) and snapshot tests for `ReceiptContent` |
