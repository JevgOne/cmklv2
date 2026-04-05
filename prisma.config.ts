import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler",
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
