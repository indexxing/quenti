import { execSync } from "child_process";

const { MYSQL_URL, POSTGRES_URL } = process.env;

if (!MYSQL_URL || !POSTGRES_URL) {
  console.error("Set MYSQL_URL and POSTGRES_URL to migrate.");
  process.exit(1);
}

execSync(`pgloader ${MYSQL_URL} ${POSTGRES_URL}`, { stdio: "inherit" });
