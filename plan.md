# Project Plan: Split Money Web App

## 1. Project Overview
This is a web-based application designed to help groups of friends easily split bills and manage shared expenses after outings, meals, or trips. The core problem it solves is tracking who paid for what and calculating the exact, simplified amount each person owes to avoid manual, confusing calculations.

## 2. Core Workflows
- **Onboarding:** User logs in via Facebook (capturing Name and Avatar).
- **Group Management:** User creates a group (generates a QR code) or scans an existing QR code to join a group.
- **Adding Expenses (Bills):**
  - Option A (Manual): User inputs total amount, selects participants, and either splits equally or adjusts specific amounts via input/slider.
  - Option B (AI Scan - Future): User uploads a photo of the receipt. The app uses OCR to extract items, allowing group members to claim their specific items.
- **Settlement:** The app calculates debts and uses a "Minimum Cash Flow" algorithm to simplify transactions (e.g., if A owes B $10, and B owes C $10, A pays C $10 directly).

## 3. Target Audience & Platform
- Mobile-first approach (Progressive Web App - PWA). Users will primarily access this via mobile browsers while at restaurants/cafes. UI/UX must be optimized for touch and small screens.