# Tech Stack & Architecture

## 1. Core Stack
- **Framework:** Next.js 14 (strictly using App Router).
- **Language:** TypeScript (Strict mode enabled).
- **Styling:** Tailwind CSS (utility-first) + Lucide React (icons).
- **Backend/API:** Next.js Server Actions & Route Handlers.
- **Hosting:** Vercel.

## 2. Database
- **Provider:** MongoDB (NoSQL).
- **ORM:** Mongoose.

## 3. Authentication
- **Library:** Auth.js (NextAuth v5).
- **Provider:** Facebook OAuth (Automatic sync of Name, Email, Avatar to MongoDB).

## 4. Key Libraries
- `html5-qrcode` or `qrcode.react` for QR generation and scanning.
- Google Cloud Vision API (for OCR in Phase 3).

## 5. Coding Standards for AI
- DO NOT use React Class components. Use Functional Components with hooks.
- Prefer Server Components (`server-only`) by default. Only use `'use client'` when interactivity (hooks, state, event listeners) is strictly required.
- Keep UI components decoupled from business logic.
- Always use TypeScript interfaces/types for props and database models.