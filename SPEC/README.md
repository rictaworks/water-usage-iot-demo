# SPEC/

仕様書・リバースエンジニアリング図解を管理するディレクトリ。

## ファイル一覧

| ファイル | 内容 |
|---------|------|
| `../water-usage-iot-demo-spec.md` | 主仕様書（ER図・DFD・シーケンス図・クラス図・状態遷移図・ユースケース図を含む） |
| `api.md` | API エンドポイント一覧 |

## 図解ツール

Mermaid CLI を使用する。

```bash
npm install -g @mermaid-js/mermaid-cli

# .mmd ファイルを PNG に変換
mmdc -i diagram.mmd -o diagram.png
```

## 更新ルール

- 仕様変更時は必ずこのディレクトリの該当ファイルを更新すること。
- 図解は Mermaid 形式（`.mmd`）で管理し、PNG も生成して並置すること。
