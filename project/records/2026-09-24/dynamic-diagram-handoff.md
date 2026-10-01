# 動的図解：別PCへの引き継ぎ

更新: 2026-10-01。P1の公開完了、P2の最初の単位と次回の進め方をまとめる。会話履歴、旧PCのTEMP、認証状態は不要。引き継ぎ先は **Codex / GPT-6 Astra / Ultra**。

## 現在地

P1対象は10章7記事・11章8記事の計15記事。既存10記事に、次の5記事の10図・47段階を追加した。検証・公開状態は[実施記録](../2026-10-01/p1-completion.md)と、`feat/p1-remaining-reading-diagrams` のPR本文・CIを参照する。公開後の表示確認結果はPR本文へ追記する。

| 記事 | 図 | 段階 |
| --- | --- | --- |
| 注意と文脈 | 因果注意と処理負担／キャッシュと品質 | 11 |
| 文脈内学習と記憶 | 三つの仮説／例の比較／記憶と評価 | 13 |
| 解釈可能性 | 観察と介入／SAE | 9 |
| 能力と限界 | 条件と検証からの能力見積り | 5 |
| マルチモーダル | 入力の表現と接続／入力の選択 | 9 |

P0のAgentループ・Workflow比較はP2に属する部分対応で、P1には加算しない。全体の初期対象は199記事。P1は[PR #65](https://github.com/pero3dev/ai-agent-library/pull/65)でsquashマージ・必須CI・Pages配信・公開表示まで完了。

2026-10-01、P2の最初の単位として「AI Agentとは何か」「ツール使用」「メモリと状態管理」の3記事に6図・36段階を実装・ローカル検証済み。[現在の実施記録](../2026-10-01/p2-agent-concepts.md)を参照する。P1の再制作や旧受入JSONの全面更新から再開しない。最終のCI・マージ・公開表示の結果は、この単位のPR本文で確認する。

2026-10-01の追加依頼で到達点をP5完了へ延長した。P1全15記事とP2の26/54記事は、PR #65〜#69・#72〜#76で必須CI・squash・Pages・公開表示まで完了。初期対象199記事のうち41記事が公開済み。02章全12記事は完了。[08章の分類・選定・依頼設計](../2026-10-01/coding-classification-selection-request.md)3記事はPR #77で必須CI・squash完了、Pages公開待ち。[ルール・権限・自動化](../2026-10-01/coding-rules-permissions-automation.md)3記事は7図36段階をローカル検証済み。次はチーム導入・評価・コストの3記事。P2残りとP3〜P5は未完了。最終公開結果は各PR本文で確認する。

## ユーザーの優先事項

- 本人がPCでじっくり学ぶ。本文・具体例の増量より、読書と一体になった高品質な動的図解を重視する。
- 読む位置への同期と、手動送り・戻る・再生・停止・シーク・拡大を保つ。止めた状態でも意味が読めること。
- 2026-10-01の追加指示: 週間枠を浪費しない。サブエージェントを控え、追加のハッシュ・証跡・独立レビューは省く。公開後は表示確認だけにする。
- 意味モデル、本文保持、ビルド、必要な表示・操作、必須CIは確認する。実施していない独立レビュー・実機確認を成功と記さない。
- 有料API、新たな外部サービス登録、次のタスクの自動作成は不要。

旧計画の「1記事ごとの独立レビュー・証跡保存・全面的な公開再検査」は、現在のユーザー指示で簡略化した。再開条件として復活させない。図登録用sourceDigestは本文変更を検出する実装として保持するが、検証のための追加台帳は作らない。

`website/lib/diagram-article-acceptance.mjs` と旧JSONは独立レビュー等の3ゲートに基づく過去の受入方式を表す。最新コードで古いゲートが一致しないことを、図が未実装であるという意味に読み替えない。未実施ゲートへ架空の成功を書き込まない。

公開済み学習記事の本文訂正だけは、現行の必須CIが通常記事manifestと独立記事レビューを要求する。任意の図解レビューと分け、必要な対象に一度だけ絞る。CIや保護規則を迂回しない。

## 最初に読むもの

1. [AGENTS.md](../../../AGENTS.md)、[CONTRIBUTING.md](../../../CONTRIBUTING.md)、[Git規約](../../../harness/git-rules.md)。現在のユーザー指示が旧計画より優先。
2. [最新実施記録](../2026-10-01/p1-completion.md)、[全体計画](../../plans/engineering/dynamic-diagrams.md)、[記事棚卸し](../../plans/engineering/dynamic-diagram-inventory.md)。
3. 実装する記事の原文と、近い既存図だけを読む。過去の画像・ログ・ハッシュ台帳を一括で読み直す必要はない。

## 新PCの準備

Node.js 22以降、Git、GitHub CLIを用意し、認証は新PCで行う。トークンや旧PCの設定をコピーしない。Windowsでは短いclone先を使う。

```powershell
git -c core.longpaths=true clone https://github.com/pero3dev/ai-agent-library.git C:/dev/ai-agent-library
cd C:/dev/ai-agent-library
git status --short --branch
git fetch origin main
gh pr view feat/p1-remaining-reading-diagrams --json state,url,mergeCommit,body
npm ci
npm ci --prefix website
```

`core.longpaths` はこのコマンドだけの指定。グローバルGit設定は変えない。既存cloneでは他者の未保存差分を確認する。

```powershell
# 開発表示
npm run dev --prefix website
# 公開相当のビルド
$env:STATIC_EXPORT='1'
$env:NEXT_PUBLIC_BASE_PATH='/ai-agent-library'
npm run build:clean --prefix website
# 変更箇所に応じた検証
npm run check
npm test --prefix website
npm run test:browser --prefix website -- learning-foundations.spec.mjs
```

Playwright環境がなければwebsite内で `npx --no-install playwright install chromium webkit` を実行する。WindowsのEdgeを使う場合は `PLAYWRIGHT_CHANNEL=msedge` を設定する。WebKit検査は実機iPhone/Safariの確認とは異なる。

## 編集する場所

| 対象 | 正本 |
| --- | --- |
| 本文 | `docs/`。段落・式・表を保つ |
| 新しい5記事の場面 | `website/components/diagrams/{context,icl,interpretability,capabilities,multimodal}-scenes.jsx` |
| 意味モデル・段階説明 | `website/lib/learning-foundations-model.mjs` |
| 新図の描画部品 | `learning-scene-primitives.jsx`、`learning-scenes.css` |
| 同期・再生・拡大 | 既存の `reading-figure.jsx`、`reading-clock.mjs` |
| 登録・本文包装 | `website/diagrams/registry.json`、`articles.json`、`website/lib/diagram-registry.mjs`、`diagram-decoration.mjs` |
| 追加した検査 | `website/tests/unit/learning-foundations.test.mjs`、`website/tests/browser/learning-foundations.spec.mjs` |

`website/content/`、`generated/`、`out/`、`.next/`は生成物。直接編集しない。各記事はlazy chunkで読み込み、共通の停止・縮小モーション・本文fallbackを使う。新規図の追加時はMDX許可一覧と原文保持の検査も更新する。

## 次の作業

P2の中核54記事（00概要、01概念、02アーキテクチャ、08コーディングエージェント）を1〜3記事の単位で進める。コンテキスト3記事の公開後は、オーケストレーション・人の介入・エラー処理の3記事を進める。既存の図を再利用し、P1や旧証跡の作り直しを行わない。同じ波の次PRは最新のマージ済みmainから進め、次のマージ前に前単位の公開表示を確認する。P2〜P4の制作後、P5全体受入と運用移行を完了する。

## 次回に貼り付けるプロンプト

```text
AI Agent Libraryの動的図解対応を、最新のP2実施記録から続けてください。
このPCには前の会話やTEMPの内容はありません。

最初にAGENTS.md、project/records/2026-09-24/dynamic-diagram-handoff.md、
索引から最新のP2以降の実施記録を読み、最新mainと
対象PR・CI・Pages公開状態を確認してください。

目的はPCで本文を読みながら理解できる、高品質な動的図解です。
文章や具体例を増やす方向ではありません。
読書同期、手動送り、戻る、再生・停止、シーク、拡大を保ってください。

週間枠を節約するためサブエージェントの常用、追加ハッシュ台帳、
大量の証跡保存、任意の独立レビューは行わないでください。
変更に必要な検査と必須CIは実行し、公開後は表示確認だけにしてください。
通常PR・CI・squashマージ・GitHub Pages反映まで進めて構いません。

P1の15記事とP2の基礎概念3記事を作り直さず、棚卸しから次の1〜3記事を選び、
短い方針を示してから自律的に実装・公開し、P5完了まで順に継続してください。
一区切りごとに進捗と次の作業を簡潔にリポジトリへ残してください。
```
