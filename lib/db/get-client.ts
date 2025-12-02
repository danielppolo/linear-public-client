import { createD1Client, type D1Client } from "./client"
import { Cloudflare } from 'cloudflare';


const cf = new Cloudflare({
  apiToken: process.env['CLOUDFLARE_API_TOKEN'],
});

export function getD1Client(): D1Client {
  const databaseId = process.env.D1_DATABASE_ID
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID

  if (!databaseId || !accountId) {
    throw new Error("D1_DATABASE_ID and ACCOUNT_ID must be set in environment variables")
  }

  return createD1Client(cf, databaseId, accountId)
}

