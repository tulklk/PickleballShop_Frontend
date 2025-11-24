# PickleBall Shop Frontend

A modern, production-ready Next.js frontend for the PickleBall e-commerce website.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (UI components)
- **TanStack Query** (React Query) for server state management
- **react-hook-form** + **zod** for form handling and validation
- **Sonner** for toast notifications
- **next-themes** for dark/light mode support

## Features

### Customer Features
- ✅ User authentication (login, register, logout)
- ✅ Product browsing with filters (category, price, search)
- ✅ Product detail pages
- ✅ Shopping cart management
- ✅ Checkout with multiple payment methods (COD, MoMo, VNPay)
- ✅ Order history and order details
- ✅ Payment return handlers

### Admin Features
- ✅ Admin dashboard
- ✅ Category management (CRUD)
- ✅ Order management (view, update status)
- ✅ Product management (CRUD)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_BASE_URL=https://pickleballshop-backend.onrender.com
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── account/           # User account pages
│   ├── admin/             # Admin pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout page
│   ├── payments/          # Payment return handlers
│   ├── products/          # Product pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── layout/            # Layout components (Navbar, Footer, AdminSidebar)
│   ├── shared/            # Shared components (ProductCard, ProductGrid)
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── api/               # API client and hooks
│   │   ├── client.ts      # API client with authentication
│   │   ├── hooks.ts       # React Query hooks
│   │   └── types.ts       # TypeScript types from Swagger
│   ├── auth/              # Authentication utilities
│   └── utils/              # Utility functions
└── public/                 # Static assets
```

## API Integration

The frontend integrates with the backend API at `https://pickleballshop-backend.onrender.com`.

### Authentication

- Access tokens are stored in localStorage
- Refresh tokens are stored in localStorage
- All authenticated requests include `Authorization: Bearer <token>` header
- Automatic token refresh is handled by the API client

### API Client

The API client (`lib/api/client.ts`) provides typed methods for all backend endpoints:
- Auth endpoints (login, register, refresh, logout)
- Product endpoints (list, detail, search, featured)
- Cart endpoints (get, add, update, delete, clear)
- Order endpoints (create, list, detail, payment)
- Admin endpoints (categories, orders, products)

### React Query Hooks

All API calls are wrapped in React Query hooks for:
- Automatic caching
- Background refetching
- Loading and error states
- Optimistic updates

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: Base URL for the backend API (default: https://pickleballshop-backend.onrender.com)

## Building for Production

```bash
npm run build
npm start
```

## Key Features Implementation

### Authentication Flow
1. User logs in/registers
2. Access token and refresh token are stored
3. Access token is attached to all API requests
4. On 401 errors, refresh token is used to get a new access token
5. Logout clears tokens and redirects

### Cart Management
- Cart is fetched from backend on load
- Add to cart updates backend and invalidates cache
- Cart count is displayed in navbar
- Cart persists across sessions (backend-managed)

### Payment Flow
1. User creates order at checkout
2. If payment method is MoMo/VNPay, payment URL is generated
3. User is redirected to payment gateway
4. After payment, user returns to `/payments/momo/return` or `/payments/vnpay/return`
5. Payment status is verified and displayed

### Admin Features
- Admin routes are protected by `RequireAdmin` component
- Admin sidebar navigation
- Full CRUD for categories
- Order status management
- Product management (if endpoints exist)

## Notes

- The backend Swagger JSON was used to generate TypeScript types
- All API endpoints are typed based on the Swagger specification
- Error handling is implemented throughout with toast notifications
- Responsive design using Tailwind CSS
- Dark mode support via next-themes (can be toggled)

## License

ISC

