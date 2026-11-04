/**
 * D1（本番・wrangler dev）と、テスト用の SQLite アダプタの両方に使う最小インターフェース。
 * 使う API は prepare / bind / first / all / run / batch のみに限定する。
 * D1 のバインドは boolean を受け付けないため、呼び出し側で 0 / 1 に変換してから渡すこと。
 */
export interface SqlStatement {
  bind(...values: unknown[]): SqlStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface SqlDatabase {
  prepare(query: string): SqlStatement;
  /** 全ステートメントを1トランザクションとして実行する（D1 の batch と同じ意味）。 */
  batch(statements: SqlStatement[]): Promise<unknown[]>;
}
