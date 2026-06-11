# Database Schema Design (MongoDB)

## 1. User Model
- `_id`: ObjectId
- `name`: String (Required)
- `email`: String (Unique, Sparse)
- `image`: String (URL to Facebook Avatar)
- `facebookId`: String (Unique, Required)
- `createdAt`: Date

## 2. Group Model
- `_id`: ObjectId
- `name`: String (Required)
- `createdBy`: ObjectId (Ref: User)
- `members`: Array of ObjectId (Ref: User)
- `inviteCode`: String (Unique, used for QR generation)
- `createdAt`: Date

## 3. Bill Model
- `_id`: ObjectId
- `groupId`: ObjectId (Ref: Group, Required)
- `description`: String (e.g., "Lẩu Thái", "Karaoke")
- `totalAmount`: Number (Required)
- `paidBy`: ObjectId (Ref: User, Required - Who paid the bill)
- `splits`: Array of Objects
  - `userId`: ObjectId (Ref: User)
  - `amount`: Number (How much this user owes for this bill)
- `imageUrl`: String (Optional, for OCR receipts)
- `createdAt`: Date