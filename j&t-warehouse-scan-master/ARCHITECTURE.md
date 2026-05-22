# SPRINTER NỘI BỘ - Production Architecture

This document maps out the final production architecture and folder structure for **SPRINTER NỘI BỘ**, a high-performance internal warehouse scan-and-proof system for J&T shipment handover operations.

## 1. Technical Stack & Capability Matrix

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | React 19 + TypeScript | Mobile-first dashboard, responsive listings, and controls |
| **Styling** | Tailwind CSS v4 | Clean enterprise typography, high contrast dark/light themes |
| **Native Integration** | Capacitor Bridge | Access native hardware features (Camera, Flashlight, Haptics) |
| **High Sensitivity Scanner** | Google ML Kit / WebRTC Native | Instant recognition like iCheck and J&T Sprinter |
| **Backend / Shared Storage** | Google Apps Script (GAS) API | Real-time master synchronization without complex server hosts |
| **Database Sheet** | Google Sheets | Live spreadsheet accessible by administrative managers |

---

## 2. Production Folder Structure

The applet utilizes a modular structure preventing large compilation units and ensuring type-safe coordination:

```
├── /
│   ├── .env.example                # Example environment configuration (GAS Web App URLs)
│   ├── package.json                # Project script registry and dependencies
│   ├── metadata.json               # System capabilities and permission declarations
│   ├── ARCHITECTURE.md             # This structural architecture manifest
│   ├── src/
│   │   ├── main.tsx                # Applet rendering bootstrap
│   │   ├── index.css               # Global styled guidelines (Fonts, design system)
│   │   ├── types.ts                # Strict domain models (SprinterOrder, Status, Shifts)
│   │   ├── App.tsx                 # Core application controller & layout coordinator
│   │   ├── components/
│   │   │   ├── WelcomeModal.tsx    # Shift and Staff selection flow (Anh Tuấn, Phạm Nga, Test)
│   │   │   ├── DashboardHUD.tsx    # High impact visual panel (realtime statistics + Pie charts)
│   │   │   ├── BarcodeScanner.tsx  # Dynamic viewfinder with camera flip, flashlight, beep/vibrate
│   │   │   ├── OrderListTable.tsx  # Action state grids (date filters, select-all, bulk CSV export)
│   │   │   └── SprinterChatbot.tsx # Adaptive assistant addressing stats and orders using "sếp" / "em"
```

---

## 3. High Sensitivity Web & Native Scanning Strategy

To fulfill the **iCheck-level speed** requirement:
- **Environment Native**: Native devices bounded by the **Capacitor Bridge** utilize the fast Google ML Kit SDK via `@capacitor-mlkit/barcode-scanning`.
- **Browser/Web Fallback**: Web deployment integrates continuous, advanced fast WebRTC framing using a high FPS config (e.g. 25-30 fps), with active continuous auto-focus constraints.
- **Acoustic feedback**: Trigger immediate vibration (`navigator.vibrate`) and distinct success audio feedback.

---

## 4. Google Sheets Synchronizer Scheme

Data columns structured in Google Sheets precisely match our core schema:
1. `mã vận đơn` (The shipping/order code scanned)
2. `tên khách`
3. `số điện thoại`
4. `ngày` (Timestamp)
5. `trạng thái` ("đã bàn giao" | "không thành công" | "chưa xử lý")
6. `nhân viên scan` (Staff who scanned the packet)

Any scanning or status edits execute immediate `POST` or `GET` fetch requests to our configured GAS endpoint to guarantee zero data loss.
