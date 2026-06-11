# Execution Phases & Roadmap

## Phase 1: Foundation & Authentication (MVP 1)
**Goal:** Setup environment and allow users to enter the app securely.
- Setup Next.js boilerplate with Tailwind and Mongoose connection.
- Implement NextAuth with Facebook Provider.
- Create landing page and dashboard shell.

## Phase 2: Group Management & Manual Bills (MVP 2)
**Goal:** Core functionality. Users can create groups, add bills, and see debts.
- Implement Group creation and QR Code invite system.
- Build UI for adding manual bills (Input total -> Select Members -> Split equally or custom amounts).
- Implement the `simplifyDebts` (Minimum Cash Flow) algorithm to calculate who owes whom.
- Display "Settlement Screen" (e.g., "A needs to transfer 50k to B").

## Phase 3: OCR Integration & Polish (V2)
**Goal:** Advanced features and UX refinement.
- Integrate Google Cloud Vision API for bill scanning.
- Build UI to extract text lines into selectable "Items".
- Allow group members to check/claim items they consumed.
- Add PWA manifest to allow users to "Install" the web app to their home screen.ai_rules.md