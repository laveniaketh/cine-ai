This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## PayMongo Integration (Kiosk)

The kiosk payment confirmation screen now supports two payment methods:

- `Pay at Counter` (existing flow via `POST /api/tickets`)
- `PayMongo` (hosted checkout flow)

### Environment Variables

Add these to your `.env.local`:

```bash
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Flow

1. User selects `PayMongo` on `/kiosk/payment-confirmation`.
2. App calls `POST /api/payments/paymongo/checkout`.
3. Backend creates a pending ticket/payment + reserved seats, then creates a PayMongo checkout session.
4. User is redirected to PayMongo hosted checkout page.
5. PayMongo redirects back to `/api/payments/paymongo/callback`.
6. Callback verifies session status and updates payment to `paid` or `cancelled`, then redirects to:
	- success: `/kiosk/payment-sucessful`
	- failed: `/kiosk/payment-confirmation?payment=failed`
