# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ESP32 フローセンサーで水の流量を計測し、Next.js + Rails + SQLite のリアルタイムダッシュボードに表示する IoT デモシステム。

**技術スタック:** Next.js (TypeScript) + Ruby on Rails (API モード) + SQLite + ESP32  
**デプロイ:** Vercel（フロント）+ Railway（バック）  
**ドメイン:** rictaworks.jp のサブドメイン  
**認証:** Google ログイン（デモ版は認証なし、Cookie session_id でデータ分離）

## 参照ドキュメント

@.claude/development-principles.md
@.claude/QC10.md
@.claude/OWASP10.md
@.claude/CC.md
@.claude/TM.md
@.claude/CRAP.md

## 削除系コマンドの禁止（重要）

以下のルールはこのワークスペース内のすべての会話で絶対に守られる：

- Claude はファイルまたはディレクトリを削除するコマンドを一切生成してはならない。
  例：rm, rm -rf, rm *, rmdir, unlink, cache --delete,
      lftp mirror --delete, rsync --delete, git clean -df, find -delete 等。

- 削除が必要な場合でも、Claude は削除コマンドを提案せず、
  「手動で削除してください」といった説明に留めること。

- 削除の推奨・削除操作の自動判断も禁止。

- ssh / lftp / デプロイ系スクリプトを生成する場合でも、
  削除コマンドの生成は禁止。

## デザインモック（実装の参照仕様）

`app-ui/Water IoT Dashboard Standalone.html` が唯一のデザイン仕様。Next.js 実装は必ずこのモックに従うこと。

| 項目 | 値 |
|------|---|
| フォント（本文） | Space Grotesk |
| フォント（数値・ラベル） | DM Mono（モノスペース） |
| 背景色 | `#040810`（最深）/ `#070e1c`（サイドバー）/ `#0a1628`（カード） |
| アクセント | `#00c8ff`（シアン） |
| 警告色 | `rgba(255,200,80,.9)` / エラー: `rgba(255,80,80,.9)` |
| レイアウト | サイドバー 228px 固定 + メインエリア（flex） |

ビュー構成: ダッシュボード / 異常検知パネル / 仮想シミュレーター / デバイス登録

## ブランチ規約

- main ブランチでの作業は禁止。必ず feature/fix ブランチを切ること。
- `src/*` の変更は PR 必須（main への直 push 不可）。
- `src/*` 以外（設定ファイル、ドキュメント等）は main への push を許可。
- PR には非エンジニア向けユーザーテスト手順を丁寧に記載すること。

## 開発フロー（TDD 必須）

**plan → red test → coding → green test** の順を厳守する。

- テストフレームワーク: Jest（Next.js）/ RSpec（Rails）/ Playwright（E2E）
- コミット前に必ずセキュリティレビューを実施（`@.claude/OWASP10.md` 参照）
- フロントの動作確認方法: `curl` / `wget --mirror` / Playwright

## コーディング規約

- タイムゾーン: JST、エンコード: UTF-8
- アイコン: FontAwesome を使用。絵文字は使用禁止。
- グローバル変数禁止（セキュリティリスクのため）
- 制御構文・条件構文以外はクラスまたは関数に書くこと
- 文字列リテラルは設定ファイルに分離すること（ハードコード禁止）
- `alert()` / `confirm()` / `prompt()` はプロジェクト全体で使用禁止
- フォールバック禁止。例外処理を必ず明示的に書くこと
- デバッグトレース可能なコードを書くこと（ログ出力・例外スタック保持）
- 環境判定を実装し、開発環境では認証済み状態に分岐すること（テスト可能化）
- 環境変数は `.env` を参照すること

## 多言語対応

当初から 7 言語で実装する: 日本語 / 英語 / フランス語 / 中国語 / ロシア語 / スペイン語 / アラビア語  
管理画面（開発者向け）は日本語のみ。

## プロジェクト管理ディレクトリ規約

| ディレクトリ | 用途 |
|---|---|
| `TASKS/` | タスク管理 |
| `DEBUG/` | バグ報告 |
| `CLIENT/` | クライアント要望 |
| `WORK/` | 作業報告 |
| `ENV/DEVELOPMENT.md` | 開発環境 |
| `ENV/PRODUCTION.md` | 本番環境 |
| `SPEC/` | 仕様書・図解（ER図/DFD/シーケンス図/クラス図/状態遷移図/ユースケース図） |
| `DELETE/` | ゴミ箱（削除対象ファイルはここへ移動し、手動で処理する） |
| `test/pr***/` | PR 単位のテストスクリプト |

図解は Mermaid を使用する（`npm install -g @mermaid-js/mermaid-cli`）。

## エージェント役割（規模に応じて `.claude/agents/` に作成）

director / project-manager / designer / debugger / tester / data-scientist / deployer / writer / service-manager

## サブエージェント定義

**pr-checker:**  PR をレビューしない。全 PR を日本語に翻訳し、非エンジニア向けユーザーテスト手順を PR 本文に丁寧に記載すること。

**tester:** 全 PR を対象に、PR 本文のユーザーテスト手順を実行するスクリプトを `test/pr***/` に作成する。`@.claude/TM.md` 記載のテストを Jest / RSpec で実装する。テスト対象は開発サーバー。
