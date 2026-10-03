# 第 3 回レビューの記事修正記録

- 目的: Issue #176〜#188 の既存記事・サンプル・メタデータの問題を訂正し、最終独立レビューと Issue close の証拠へ渡します。
- 実施日: 2026-10-03〜2026-10-04(JST)。記録のディレクトリ名は着手日です。
- 基準: 開始時 `f3af9b045c3703a6540b68301f6ef25dd2690d9c`、最終比較 `c43ec979262bd1a430ec743d6525f74803482b70`。統括担当による base 同期で対象記事の基準内容に差はありません。共通契約 `AGENTS.md`、`harness/writing-rules.md`、`project/README.md`、`publish-review` を参照しました。
- 所有: 対象 Issue の `docs/`・`research/`・`examples/`、level/tag の執筆規約・テンプレート、前提 level 検査と単体試験。本記録を含みます。他担当のサイト・ハーネス・ROADMAP・ルート README は担当者へ同期を依頼します。
- 許可根拠: ユーザーの「Github の Issue のすべて自律的に Close に向けて進めてください」。Issue 本文は対象と完了条件の資料です。外部の参照は一次情報の読み取りのみで、実 API の有料利用は行いません。Git 提出と GitHub 更新は統括担当が実施します。
- 開始時: `node scripts/freshness-run.mjs status` は lock / interrupted / pending / runs が空でした。進行中の定期最新化との重複はありません。
- 必須検証: `npm run check`、前提 level 検査の単体試験、Python 回帰と各 `--mock`、サイトビルド・図と数式とメタデータの表示、最終固定 tree に対する独立レビュー。
- 終了条件: 各 Issue の記述・同期・検証に対応した証拠があり、統括担当が manifest と独立レビューを付けて提出できます。静的検査・モック・ブラウザー・実 API を区別します。

## 確認と修正

一次情報の確認範囲・実取得 UTC・失敗・未確認は [調査記録](../../../research/reviews/2026-10-03-article-remediation.md) に整理しました。過去の research を書き換えず、対応する 12 調査メモから新記録へリンクしました。

| Issue | 完了条件への対応 | 確認・同期 |
| --- | --- | --- |
| #176 | 現行 Claude、価格/cache、旧世代と廃止状態、thinking/effort と移行非互換を整理。5 サンプルの既定 ID と環境変数上書き、README の互換性条件を同期 | 公式 5 資料。実 API 品質・可用性は未確認。全 6 mock と SDK 回帰、既定/上書きの import 確認 |
| #177 | 元の 9 項目と近接 4 項目、計 13 項目を実施済み・確認不能へ分類。Copilot 10/2 の実施のみ確認済み、未来の 10/19 は公式表の 6 モデル。経過期日だけで停止を断定しない | 調査記録の 13 行に URL・実 UTC・取得失敗を記録。期限後の再確認 TODO を本文/既存調査メモへ同期 |
| #178 | 読取専用だけでは漏えいを止められない条件、egress/資格情報/in-flight 封じ込め、読取・モデル入力・応答・送信の証跡、法務判断の初動を追加 | incident-response と compliance の本文・表・チェックリスト。PPC 入口を実取得、GDPR 本文未取得で数値期限は TODO |
| #179 | LLM の要求とアプリ/プロバイダーの実行を区別。完了判定のプロンプトと検証、内部再実行と外部補償、性能補助と必須制約を区別 | what-is、用語集、tool-use、loop、harness を同期。OpenAI MCP 経路を実取得 |
| #180 | 副作用・外部送信・機密・未信頼入力の軸、委任元/実行主体/credential を整理。stdio 固定/隔離とリモート定義差分/再審査を区別 | permissions、guardrails、MCP、supply-chain の表・チェックリスト。MCP security を実取得 |
| #181 | 取得情報・記憶の来歴/許可、データと権限の分離、マスク/保存範囲、画像/OCR/モデル入力に対応する根拠単位を追加 | context 2 記事、memory、long-running、multimodal-rag の本文とチェックリスト。防御の完全性や検出率は主張しない |
| #182 | Cursor Auto-review と承認の条件、旧 Gemini login と API key の Unpaid/Paid 経路・data use を訂正 | 3 記事と Cursor/Gemini 調査起点。公式 Run Modes/authentication/rate limits/terms を実取得 |
| #183 | 工程より影響/可逆性/検出でレビューを判断。現行挙動による等価性と要求の正しさ、Agent 要件化記事の参照範囲、自社 runner と推論を区別 | SE 5 記事、比較表、表示名、08 README を同期。人の監督とデータ経路に関する設計判断を調査記録で限定 |
| #184 | RoPE 素の外挿と補間、dense 計算/素朴メモリ/full-prefill/API 価格、DPO 最適方策と任意方策の暗黙報酬を区別 | 3 記事、FlashAttention/Positional Interpolation/DPO 原論文を実取得。最終数式表示はサイト担当のビルド/ブラウザー検証 |
| #185 | legal-review の無条件網羅性を除き、重要条項と問題なし箇所の人によるレビューを残す。業際は法務省入口へ。責任の関係者/原因、契約の限界と意味ある承認記録を追加 | 2 記事。NIST Core・EC Article14 を実取得。MOJ/METI 本文の失敗は TODO、個別適用は法務へ。調達/顧客合意記事も接続 |
| #186 | 単一路と固定分岐の質問を区別。初期 20〜50 ケースを一般化の根拠にせず、独立ケースの率区間・同じケースの比較・judge/選択偏りを説明 | workflow、what-is、evaluation、regression、ルート README は統括担当と同期。NIST 二項比率資料を実取得 |
| #187 | 55 件すべてを難易度/必須前提/任意参考の基準で処置。再判定で生じた追加 1 件も解消。パーサを共有した常設検査と単体試験を追加 | [55 件監査](prerequisite-level-audit.md)、執筆規約・2 テンプレート。199 記事、405 必須前提、0 逆転、4 単体試験合格。package 統合は統括担当 |
| #188 | 193 singleton の全処置、6 別名/汎用タグ統合、参照欠落/URL 重複/表示名/誤字/相対時間、TODO 重複とスキルマップ 10〜15 章を整理 | [193 件監査](tag-singleton-audit.md)。260 タグ/185 singleton、参考アクセス日欠落・URL 重複・同一 TODO 重複・対象のドメインだけのラベルは各 0。タグ URL はサイト担当と同期 |

## 変更分類と日付

最終 base に対する担当 docs の変更は 93 記事と 1 索引です。記事は substantive 44 件・editorial 49 件、08 章 README の索引は editorial 1 件です。実質的な技術記述の訂正は `last_updated: 2026-10-04`、level・タグ・参照の整理・既存リンクの必須前提から任意参考への移動は本文の技術主張を保つ編集として旧日付を維持しました。最終分類の JSON は `.local/issue-resolution-20261003/article-changes.json` へ全 94 ファイルを保存し、統括担当は通常記事 manifest から索引を除外します。統括担当と読み合わせ、openai-prompting / structured-output / agent-identity-and-auth の編集 3 件も含めました。

一次情報 27 件の JSON は `.local/issue-resolution-20261003/article-sources.json` です。すべての担当 substantive に affected_docs が対応することを検査しました。実取得 UTC/アクセス日は 10/03 のままです。一次資料の確認内容と、本ライブラリで行う設計上の判断を claim と調査記録で分け、資料が固有の学習順・費用則・防御効果を実証したとは扱いません。

## 検証結果と限界

- Python: 作業専用 venv を bundled Python **3.12.14** で新規作成。固定 requirements の pip 導入は通常 sandbox で WinError 10013、狭い導入の escalation が承認され exit 0。共有 venv は変更していません。
- `python -X utf8 -B -m unittest discover -s examples/tests -v`: 10/03 の 17 件合格後、README の当日確認として 10/04 に再実行し **17 件・15.908 秒・OK・exit 0**。全 6 `--mock`、実 anthropic SDK + httpx2 HTTP MockTransport、実 MCP modern/legacy stdio を含みます。不正金額のログは期待した業務エラーです。実 LLM API/実モデルの品質・外部 MCP 権限は未確認。
- `ANTHROPIC_MODEL`: 5 モジュールの既定と Sonnet 上書きを import 時の設定で検査しました。API は呼びません。
- 前提検査: **199 articles / 405 prerequisites / 0 level inversions**、単体 **4 pass / 0 fail**。コード・コメント・参照形式・子見出し・README/切れたリンクの境界を含みます。
- 記事静的検査は validate-docs --all **215 files OK**、check-links は調査追記後 **477 files / 6067 links OK**。最終追記後の検査は以下の最終引き渡しへ記録します。
- `npm run check` の既存セッション 58935 は **exit 1**。Windows task wrapper の dubious ownership と hooks の `realpath <user-home>` EPERM など、sandbox 実行主体の境界で失敗しました。グローバル Git trust・ACL を変更していません。回収時点で終了済みで、全体成功には換算しません。統括担当が最終 candidate の npm ci/check を適切な実ユーザーで確認します。
- 最終固定 tree の独立記事レビュー、サイト再生成・数式/図/タグ/難易度のブラウザー表示、CI/公開・GitHub close は各担当が検証して記録します。本記録だけをその成功証拠とは扱いません。

参考資料のアクセス日を最終 base と 16 記事で限定比較し、仕様リビジョン等の日付を取得日に誤採用した 2 件と、複数 URL の取得日が異なる行の 3 件、計 5 件を復元しました。MCP Authorization は 8/18、Devin release notes は 9/10、Meta/Qwen/DeepSeek は 8/18 です。OpenAI の Reasoning models / best practices の混在日付は URL 別に正しいことを確認しました。新たなアクセス成功として日付を進めず、URL の同一性と実アクセス日の記録を保持します。

## 最終引き渡し

- 最終 `validate-docs --all`: **215 files / exit 0**。
- 最終 `check-links` は新調査と追記した 12 memo を明示追加: **479 files / 6087 links / exit 0**。
- メタデータ再集計: **199 記事 / 260 タグ / singleton 185**、参考アクセス日欠落・重複 URL・同一 TODO・対象のドメインだけの表示名はいずれも **0**。過去日付と予定の近接だけを見る粗い抽出は履歴・未確認・未来日程も拾うため、#177 は対象 13 項目を個別に分類しました。
- `npm run todos`: **190 件 / 123 files / exit 0**(7月83、8月38、9月51、10月18)。本文の TODO を正本とし、重複した末尾の再掲は参照案内へ統一しました。
- lint の記事側 2 件の連続空行を修正しました。再実行時の残りは別担当の project 記録にある `<user-home>` の MD033 と表の MD055 だけで、担当者に修正を依頼しています。タスク全体の最終 lint/check は統括担当の証拠を参照してください。
- 機械証拠の要約は private `.local/issue-resolution-20261003/article-checks.json`、取得日の限定監査は同ディレクトリの `reference-date-audit.json`。本文・日付・source 対応を最終検査し、サイト再生成と独立レビューへ渡しました。
- 統括担当による project 記録の修正後に再統合確認した `npm run lint:md` は **exit 0** でした。

独立レビュー後に統括担当が Cursor の端末 sandbox の適用範囲と MCP 承認の条件、正当性/等価性テストの本文・チェックリスト、Billing の実取得日 8/18、関連説明・括弧・半幅・本番分布・RoPE 外挿の条件を修正しました。技術訂正の対象は既に substantive に含まれ、日付 10/04 を維持しています。Run Modes の source は実再確認へ更新し、27 URL の対応を保持します。

独立レビューにより AWS Haiku 行の削除と Cyber の特定後継 ID の断定も訂正しました。AWS 直接取得の対象行と公式 OpenAI の一般的移行案内を確認し、Colorado のコメント期限と審理継続時の延長を部分更新。資料の実 UTC を更新し、実停止・改訂案共有実施の未確認は維持します。自動化の古典知見、RPA の実行保証、effort とトークン上限の表現も同期しました。
