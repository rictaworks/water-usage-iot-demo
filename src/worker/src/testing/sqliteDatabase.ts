import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { SqlDatabase, SqlStatement } from "../db/types";

/**
 * テスト用の D1 互換アダプタ（node:sqlite 上）。本番と同じ migrations/0001_init.sql を読み込む。
 * D1 と同じく boolean・undefined のバインドは拒否し、呼び出し側の 0 / 1 変換漏れを検出する。
 */

const MIGRATION_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migrations/0001_init.sql");

function toSqlValue(value: unknown): SQLInputValue {
  if (value === null || typeof value === "string" || typeof value === "number") return value;
  throw new Error(`unsupported D1 bind value: ${typeof value}`);
}

class SqliteStatement implements SqlStatement {
  constructor(
    private readonly sqlite: DatabaseSync,
    private readonly query: string,
    private readonly values: SQLInputValue[] = []
  ) {}

  bind(...values: unknown[]): SqlStatement {
    return new SqliteStatement(this.sqlite, this.query, values.map(toSqlValue));
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const row = this.sqlite.prepare(this.query).get(...this.values);
    return (row as T | undefined) ?? null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    return { results: this.sqlite.prepare(this.query).all(...this.values) as T[] };
  }

  async run(): Promise<unknown> {
    this.execute();
    return { success: true };
  }

  execute(): void {
    this.sqlite.prepare(this.query).run(...this.values);
  }
}

class SqliteDatabase implements SqlDatabase {
  constructor(private readonly sqlite: DatabaseSync) {}

  prepare(query: string): SqlStatement {
    return new SqliteStatement(this.sqlite, query);
  }

  async batch(statements: SqlStatement[]): Promise<unknown[]> {
    this.sqlite.exec("BEGIN");
    try {
      const results = statements.map((statement) => {
        if (!(statement instanceof SqliteStatement)) throw new Error("foreign statement in batch");
        statement.execute();
        return { success: true };
      });
      this.sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
}

export interface TestDatabase {
  db: SqlDatabase;
  sqlite: DatabaseSync;
}

export function createTestDatabase(): TestDatabase {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(readFileSync(MIGRATION_PATH, "utf8"));
  return { db: new SqliteDatabase(sqlite), sqlite };
}
