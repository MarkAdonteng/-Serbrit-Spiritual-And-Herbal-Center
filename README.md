# Serbrit Spiritual And Herbal Center

Vite + React storefront and admin dashboard backed by Firebase (Auth, Firestore, Storage).

## Setup

1. Create a Firebase project.
2. Enable:
   - Authentication → Email/Password
   - Firestore Database
   - Storage
3. Copy `.env.example` to `.env` and fill in the Firebase web app config values.
4. Set `VITE_ADMIN_EMAIL` to the email you want to allow into `/admin`.
5. Install and run:

```bash
npm install
npm run dev
```

## Data Model

**Firestore**
- `products` collection:
  - `name` (string)
  - `category` (string)
  - `price` (number)
  - `description` (string)
  - `imageUrl` (string)
  - `imagePath` (string, optional; Storage path used for cleanup on delete)
  - `stockQty` (number)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
- `orders` collection:
  - `items` (array of `{ productId, name, price, qty }`)
  - `customer` (object)
  - `total` (number)
  - `status` (string)
  - `createdAt` (timestamp)
