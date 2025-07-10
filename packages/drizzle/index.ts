import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { env } from "@quenti/env/server";

import * as schema from "./schema";

export * from "drizzle-orm";

export const db = env.NEON
  ? drizzle(new Pool({ connectionString: env.DATABASE_URL }), {
      schema,
    })
  : null;
