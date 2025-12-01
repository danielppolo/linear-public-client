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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
