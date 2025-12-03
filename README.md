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

### Connect to Linear

The home page now surfaces live tasks from a Linear project. Provide the following secrets in a `.env.local` file before starting the dev server:

```
LINEAR_API_KEY=sk_XXXXXXXXXXXXXXXXXXXX
LINEAR_PROJECT_ID=proj_XXXXXXXXXXXXXXX
```

Generate a personal API key under **Linear → Settings → API**, then grab the project ID from the project settings URL. Restart `npm run dev` after editing the `.env.local` file so the server picks up the values.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### List Linear projects from the CLI

Use the typed Linear utility outside of the UI by running:

```
npm run linear:projects [limit]
```

The optional `limit` argument controls how many projects are returned (defaults to 25). Ensure `LINEAR_API_KEY` is exported or stored in `.env.local` so the script can authenticate.

## API Configuration

For detailed API documentation, see [API.md](./API.md).

### Customer Requests API

The API endpoints require bearer token authentication. Add the following to your `.env.local`:

```
API_BEARER_TOKEN=your-secret-bearer-token-here
```

All endpoints under `/v1/customer-requests` require the `Authorization: Bearer <TOKEN>` header.

### Webhook Authentication

For the Linear webhook endpoint (`/v1/webhooks/linear`), you can use either:

**Option 1: Bearer Token**
```
WEBHOOK_BEARER_TOKEN=your-webhook-bearer-token-here
```

**Option 2: HMAC-SHA256 Signature (Linear's signing secret)**
```
LINEAR_WEBHOOK_SECRET=your-linear-webhook-secret-here
```

If neither is configured, webhook authentication is skipped (development only). In production, at least one should be configured.

### Database Configuration

For Cloudflare D1 database access:

```
D1_DATABASE_ID=your-d1-database-id
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

### OpenAI Integration (Phase 3)

To enable AI-powered issue structuring and user response generation:

```
ENABLE_AI=true
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXX
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

When `ENABLE_AI=true`:
- Customer requests are automatically structured into well-formed Linear issues
- User-facing confirmation messages are generated after issue creation
- Resolution messages are generated when issues are marked as resolved

If OpenAI fails or is disabled, the system falls back to default behavior.

### Complete Environment Variables

```
# Linear API
LINEAR_API_KEY=sk_XXXXXXXXXXXXXXXXXXXX
LINEAR_PROJECT_ID=proj_XXXXXXXXXXXXXXX

# API Authentication
API_BEARER_TOKEN=your-api-bearer-token

# Webhook Authentication (choose one or both)
WEBHOOK_BEARER_TOKEN=your-webhook-bearer-token
LINEAR_WEBHOOK_SECRET=your-linear-webhook-secret

# Cloudflare D1
D1_DATABASE_ID=your-d1-database-id
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# OpenAI (Phase 3 - Optional)
ENABLE_AI=true
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXX
OPENAI_MODEL=gpt-4o-mini
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
