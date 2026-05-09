import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env") });

const backupPath =
  process.env.SUPABASE_BACKUP_PATH ||
  "/Users/vinayak/Downloads/db_cluster-29-07-2025@16-20-55.backup";

const tables = [
  "branches",
  "companies",
  "coordinators",
  "criteria",
  "criteria_branches",
  "drives",
  "students",
  "placements",
];

const sequenceNames = new Set([
  "branches_branch_id_seq",
  "companies_company_id_seq",
  "coordinators_coordinator_id_seq",
  "criteria_criteria_id_seq",
  "drives_drive_id_seq",
  "placements_placement_id_seq",
]);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");

function parseCopyValue(value) {
  if (value === "\\N") return null;

  return value.replace(/\\([btnrfv\\])/g, (_, code) => {
    switch (code) {
      case "b":
        return "\b";
      case "t":
        return "\t";
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "f":
        return "\f";
      case "v":
        return "\v";
      case "\\":
        return "\\";
      default:
        return code;
    }
  });
}

function parseCopyDump(sql) {
  const lines = sql.split(/\r?\n/);
  const result = Object.fromEntries(tables.map((table) => [table, { columns: [], rows: [] }]));
  const sequences = [];

  for (let i = 0; i < lines.length; i += 1) {
    const copyMatch = lines[i].match(/^COPY public\.([a-z_]+) \(([^)]+)\) FROM stdin;$/);

    if (copyMatch) {
      const [, tableName, rawColumns] = copyMatch;

      if (!tables.includes(tableName)) {
        while (i + 1 < lines.length && lines[i + 1] !== "\\.") i += 1;
        continue;
      }

      const columns = rawColumns.split(", ").map((column) => column.replace(/^"|"$/g, ""));
      const rows = [];

      while (i + 1 < lines.length) {
        i += 1;
        if (lines[i] === "\\.") break;

        const values = lines[i].split("\t").map(parseCopyValue);
        if (values.length !== columns.length) {
          throw new Error(
            `Invalid COPY row for ${tableName}: expected ${columns.length} values, got ${values.length}`,
          );
        }
        rows.push(values);
      }

      result[tableName] = { columns, rows };
      continue;
    }

    const sequenceMatch = lines[i].match(
      /^SELECT pg_catalog\.setval\('public\.([a-z_]+)', ([0-9]+), (true|false)\);$/,
    );

    if (sequenceMatch && sequenceNames.has(sequenceMatch[1])) {
      sequences.push({
        name: sequenceMatch[1],
        value: Number(sequenceMatch[2]),
        isCalled: sequenceMatch[3] === "true",
      });
    }
  }

  return { tables: result, sequences };
}

function quoteIdent(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function sqlLiteral(value) {
  if (value === null) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function insertRows(tx, tableName, columns, rows) {
  if (rows.length === 0) return;

  const columnSql = columns.map(quoteIdent).join(", ");
  const placeholders = rows.map((row) => `(${row.map(sqlLiteral).join(", ")})`);

  const sql = `INSERT INTO ${quoteIdent(tableName)} (${columnSql}) VALUES ${placeholders.join(", ")}`;
  await tx.$executeRawUnsafe(sql);
}

async function getCounts(prisma) {
  const counts = {};

  for (const tableName of tables) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM ${quoteIdent(tableName)}`,
    );
    counts[tableName] = rows[0]?.count ?? 0;
  }

  return counts;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to .env before running the seed script.");
  }

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const dump = fs.readFileSync(backupPath, "utf8");
  const parsed = parseCopyDump(dump);

  console.log("Parsed backup rows:");
  for (const tableName of tables) {
    console.log(`- ${tableName}: ${parsed.tables[tableName].rows.length}`);
  }

  if (dryRun) {
    console.log(`Dry run complete. No database writes were made.`);
    return;
  }

  const prisma = new PrismaClient();

  try {
    const beforeCounts = await getCounts(prisma);
    const existingRows = Object.values(beforeCounts).reduce((sum, count) => sum + count, 0);

    if (existingRows > 0 && !force) {
      throw new Error(
        `Target database already has app-table rows. Re-run with --force to truncate and reseed.`,
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          `TRUNCATE TABLE ${tables.map(quoteIdent).join(", ")} RESTART IDENTITY CASCADE`,
        );

        for (const tableName of tables) {
          const { columns, rows } = parsed.tables[tableName];
          await insertRows(tx, tableName, columns, rows);
        }

        for (const sequence of parsed.sequences) {
          await tx.$executeRawUnsafe(
            `SELECT pg_catalog.setval('public.${sequence.name}', ${sequence.value}, ${sequence.isCalled})`,
          );
        }
      },
      { timeout: 60_000 },
    );

    const afterCounts = await getCounts(prisma);

    console.log("Seed complete. Neon row counts:");
    for (const tableName of tables) {
      console.log(`- ${tableName}: ${afterCounts[tableName] ?? 0}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
