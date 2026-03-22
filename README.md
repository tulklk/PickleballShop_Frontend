# PickleBall Shop Frontend

A modern, production-ready Next.js frontend for the PickleBall e-commerce website.

## Tech Stack

- **Next.js 16 (App Router)** – file-based routing, server components, and optimized bundles for a production-ready storefront.
- **React 19** – hooks-first UI layer that keeps every screen responsive and interactive.
- **TypeScript** – strict typing across API clients, hooks, and components to catch regressions before runtime.
- **Tailwind CSS** – utility-first styling for rapid iteration while keeping the design system consistent.
- **shadcn/ui** – accessible, themeable primitives for dashboards, forms, and navigation elements.
- **TanStack Query (React Query)** – declarative data fetching, caching, and background refetch for every API call.
- **react-hook-form + zod** – schema-driven forms with client-side validation and ergonomic error handling.
- **Sonner** – lightweight toast notifications that surface success/error states in real time.
- **next-themes** – maintains dark/light preferences across sessions without additional wiring.

## How These Technologies Work Together

- **Application architecture**: Next.js App Router structures pages under `app/` while server actions and route handlers talk to the backend Render API. React 19 components hydrate seamlessly on the client for rich interactions.
- **Data layer**: `lib/api/client.ts` centralizes Axios/fetch logic, while `lib/api/hooks.ts` exposes TanStack Query hooks (pagination, infinite scroll, optimistic updates). Errors propagate through typed `ApiError` objects.
- **Forms & validation**: Admin/product forms are powered by `react-hook-form` controllers with `zod` schemas, ensuring the same validation rules on both client and server. File uploads use `FormData` and Cloudinary helpers with timeout protection.
- **Styling system**: Tailwind tokens define spacing, color, and typography; shadcn/ui components (Card, Badge, Button, Input, Select) inherit the same tokens so marketing and admin surfaces stay cohesive.
- **Internationalization & UX**: Key flows (login, orders, navbar) are localized to Vietnamese, using shared constants to avoid duplicated strings. Sonner toasts present localized feedback for all mutations.
- **Theming & accessibility**: `next-themes` persists the user’s preferred palette, while shadcn/ui primitives include focus states and ARIA attributes out of the box.
- **Testing & deployment readiness**: Strict TypeScript plus linting keeps builds green for Vercel. Logs sprinkled through admin workflows give recruiters insight into the debugging story when integrating with .NET backend APIs.

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
NEXT_PUBLIC_API_BASE_URL=https://pickleballshop-backend.fly.dev
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**Note:** To enable Google Sign-In, you need to:
- Create a Google OAuth 2.0 Client ID in the [Google Cloud Console](https://console.cloud.google.com/)
- Add `http://localhost:3000` to authorized JavaScript origins
- Add `http://localhost:3000/login` to authorized redirect URIs
- Copy the Client ID to `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`

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

The frontend integrates with the backend API at `https://pickleballshop-backend.fly.dev`.

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

- `NEXT_PUBLIC_API_BASE_URL`: Base URL for the backend API (default: https://pickleballshop-backend.fly.dev). Used by REST, SignalR support chat, and **admin notifications** hub (`/hubs/admin-notifications`).
- `NEXT_PUBLIC_API_URL`: Optional alias for the same base URL if you prefer the shorter name (see `src/services/adminNotificationsHub.ts` / `supportChatService`).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID for Google Sign-In (required for Google login feature)

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

