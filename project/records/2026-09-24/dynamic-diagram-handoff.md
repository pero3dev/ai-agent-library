# 動的図解の別PCへの引き継ぎ

状態: **作成中・P1未完了。最終引き継ぎではない**。2026-09-30、D1公開受入を完了し、D2推論モデルの制作を始めた段階の入口。会話履歴、旧PCのTEMP、認証状態がなくても、この文書とリポジトリ内の証拠から再開する。次のPCはユーザー指定のCodex / GPT-6 Astra / Ultraを想定する。

## 現在地と次の操作

| 区分 | 確定した状態 | 正本・証拠 |
| --- | --- | --- |
| 正式な公開受入 | **P1 9/15記事**。最新はPR #63、merge `b6686c92dbb678ea8b94eb12df37a33207c4c84b` | [固定した9記事の受入](../2026-09-30/diagram-acceptance-pr63.json)、[D1公開受入記録](../2026-09-30/alignment-reading-diagrams.md)、[公開証拠と137実視認](../2026-09-30/alignment-public-evidence/README.md) |
| D2 推論モデル | `feat/reasoning-reading-diagrams`、baseはPR #63。2図・9段階の実装・独立ローカル受入を完了しPR提出を準備。D2の公開受入は未完了 | [D2の作業契約と検証](../2026-09-30/reasoning-reading-diagrams.md)、[kit計画と独立レビュー](../2026-09-30/reasoning-kit-preparation/README.md) |
| E1以降 | 製品は未着手。具体案の独立レビュー済み | [後続記事の具体案・レビュー](../2026-09-30/p1-interface-preparation/README.md) |

D1のmain CI `36702086701`・Pages deploy `109848894912`、artifact `11090349965`・BUILD_ID `Iytr-Mx-iwwzxrZ8pUUHR`を公開版と照合した。Edge107/107、WebKit初回106/107と同条件の限定2/2による合成受入で、初回の失敗原因は未確定。137枚を独立実視認し、9記事の現行入力を受入済み。固定snapshotは当該公開版の結果であり、D2の共有入力変更後の受入を代替しない。

残る順序はD2 reasoning-models → E1 attention-and-context → E2 in-context-learning-and-memorization → E3 interpretability-basics → F1 capabilities-and-limits → F2 multimodal-models。[採択済み対応表](p1-remaining-storyboards.json)が記事パス・論点・段階の正本。D2 kitは14ケース追加、合計121ケース・10記事へ拡張する。制作中の最新コードと検査結果はD2記録で確認する。

## ユーザー方針と停止境界

本人がPCでじっくり学べる、記事と一体になった高品質な動的図解を作る。本文・具体例の増量は目的ではない。読む位置への同期、手動送り・戻る・再生・停止・シーク・拡大を備え、停止中にも意味が読める図にする。SVG/HTMLと既存共通操作を使い、有料APIや新たな外部サービス登録は含めない。

P1は10章7記事・11章8記事の計15記事。**15/15の公開受入（全体15/199）で停止し、P2へ進まない**。P0で部分対応したAgentループ・Workflow比較の2記事を完了数に加えない。今回の実装、通常修正、独立レビュー、既存公開GitHubへのPR・通常CI・マージ・Pages確認は許可済み。次回の範囲はそのときのユーザー依頼で確定し、新しいタスクの自動作成はしない。

## 読む順と編集する正本

1. [AGENTS.md](../../../AGENTS.md)、[CONTRIBUTING.md](../../../CONTRIBUTING.md)、[Git共通規約](../../../harness/git-rules.md)。他者の差分を戻さず、生成物を直接編集しない。
2. この入口と[展開状況](dynamic-diagram-rollout.md)、現在の制作記録。次に[採択計画](../../plans/engineering/dynamic-diagrams.md)と[199記事の棚卸し](../../plans/engineering/dynamic-diagram-inventory.md)。計画中の「未着手」は採択時点の記述として読む。
3. [サイトREADME](../../../website/README.md)、[図登録](../../../website/diagrams/registry.json)、[論点割当](../../../website/diagrams/articles.json)、[記事別受入](../../../website/lib/diagram-article-acceptance.mjs)、[公開検証kit](../../../scripts/diagram-release/README.md)。

本文は `docs/`、場面は `website/components/diagrams/`、純粋な意味・数値モデルは `website/lib/`、試験は `website/tests/` が正本。段落・式・表・MermaidをMarkdown ASTのまま包装し、本文を図定義へ複製しない。公開済みの制作単位を最初から作り直さない。

## 新PCの準備

任意のclone先で `pero3dev/ai-agent-library` の最新mainと未完了PRを確認する。Git、Node.js 22以上、PowerShell 7以上、GitHub CLI、tarを準備し、GitHub認証は新PCで行う。旧node_modules・認証情報・ローカルrunを移す必要はない。

ルートと `website/` で各 `npm ci`、`website/` で `npx --no-install playwright install chromium webkit` を実行する。Edgeを使う場合は別途インストール済みであることを確認する。Pythonなど追加検査の条件はCONTRIBUTINGに従う。

```text
git status --short --branch
git remote -v
node website/scripts/diagram-coverage.mjs
node website/scripts/diagram-acceptance.mjs
```

受入CLIは保存入力と記録の整合を調べるもので、現在のGitHubや配信内容の検証ではない。不一致を過去digestの置換だけで解消しない。kitはrepoと新しい証拠出力先を明示し、出力をrepo外へ置く。準備・オフライン検査から公開実行までの正確なコマンドは[kit README](../../../scripts/diagram-release/README.md)に従う。[移管記録](diagram-release-portability.md)も参照する。

## 1制作単位の作業サイクル

1. 全主要論点を図の段階または原文で保持する理由へ対応付け、意味モデル・絵コンテ・AST境界を作者以外が確認する。重要な結論を手動操作だけに隠さず、本文にない性能値・品質点数・推奨順位を作らない。
2. 実装と独立fixtureを分離し、数値・原文保持・不正MDX拒否、全READ、逆シーク、読書/手動切替、明暗・狭幅・低画面・拡大・キーボード・reduced motion・noJS・printを検査する。実画像と操作も独立レビューする。
3. 必要な本文訂正は一次情報を実取得し、[publish-review](../../../.agents/skills/publish-review/SKILL.md)の通常記事変更manifestを作る。機械検査後に候補treeとdigestを固定し、最終内容の独立記事レビューとpolicyを通す。レビュー後の追記でdigestが変わる場合も判定を同期する。
4. PR全チェック → actual merge → main CI/Pages → 同runのartifactと公開HTMLのhash/BUILD_ID照合 → 両engineの公開検査 → 独立公開レビューの順に進める。現行入力へ各ゲートを結合し、共有入力が変わった既存記事も再受入する。
5. 原本・必要画像・helper・相対索引をrepoへ保存し、展開記録とこの入口を更新する。旧版の失敗や承認はPR別snapshotに残す。15記事の公開受入で停止する。

## 根拠を辿る入口

| 内容 | 保存先 |
| --- | --- |
| D1の実装・ローカル証拠 | [移管可能な実装記録](../2026-09-30/alignment-portable-implementation.md)、[原本・168実視認画像の索引](../2026-09-30/alignment-local-evidence/index.json) |
| D1初回CI失敗・依存修正・最終提出 | [初回CI原本](../2026-09-30/alignment-ci-evidence/index.json)、[依存修正と限定継承の索引](../2026-09-30/alignment-dependency-evidence/index.json)、[最終提出原本](../2026-09-30/alignment-submission-evidence/index.json) |
| 旧PR58・59・61・62の経緯 | [推論ラベル修正](inference-score-label-fix.md)、[C1公開レビュー](training-public-review.md)、[C1相対証拠索引](training-public-evidence/public-acceptance-index.json)、[C2制作](../2026-09-25/pretraining-reading-diagrams.md)、[PR62表示修正と再受入](../2026-09-30/inference-score-spacing-fix.md) |
| C1/C2採択設計 | [詳細設計](training-storyboards.md)、[対応JSON](training-storyboards.json)、[計画レビュー](training-storyboards-review.md)、[検査結果](training-storyboards-check.json) |
| D1〜F2採択設計 | [詳細設計](p1-remaining-storyboards.md)、[対応JSON](p1-remaining-storyboards.json)、[計画レビュー](p1-remaining-storyboards-review.md)、[検査結果](p1-remaining-storyboards-check.json)、[具体案原本](../2026-09-30/p1-interface-preparation/README.md) |
| 本文訂正の一次根拠 | [C2確認](../../../research/internals/pretraining-diagram-sources-2026-09-24.md)・[JSON](../../../research/internals/pretraining-diagram-sources-2026-09-24.json)、[D1/F2確認](../../../research/internals/p1-remaining-diagram-sources-2026-09-24.md)・[JSON](../../../research/internals/p1-remaining-diagram-sources-2026-09-24.json)。D1のA1〜A3は適用済み、F2の13置換は未適用 |
| 引き継ぎ草案の過去の確認 | [独立レビュー](dynamic-diagram-handoff-draft-review.md)、[追補](dynamic-diagram-handoff-draft-review-addendum.md)。当時の準備文書の判定であり、今回の改訂やP1最終公開の承認ではない |

生証拠の絶対パス・failed・pendingを成功状態へ書き換えない。gzip原本は展開後のhashと索引で照合する。保存helperは当時の候補専用の場合があるため、再実行可能な入口かを確認し、統合済みhelperを無条件に再実行しない。旧TEMPにあることを実行条件にしない。

## 証拠の限界と最終化の残件

静的・単体・ローカルbrowser・実GitHub・公開配信・実機を区別する。Chromium/EdgeとWebKitの幅エミュレーションは物理iPhone Safariではない。実スクリーンリーダー・物理印刷・本人の学習効果は未実施なら未検証と記す。旧失敗を限定再検証や独立補完で受け入れた範囲は各原本に従い、全件再実行と呼ばない。D1依存修正では旧168画像・性能の限定継承で、新規視認・性能再走は0だった。既存チェックリストへの非阻害shouldは後続の本文改訂候補として保持する。

P1完了時に、最終PR・merge/tree・branchと未保存差分、15記事のinputDigestと受入結果、CI run/attempt/job/artifact/deployment、BUILD_ID・公開HTML hash・確認日時・実画像レビューを確定する。会話や旧TEMPなしで原本・ツールへ到達できること、必要な最終コードが相対pathで動くことも確認する。

[次回の貼り付け用プロンプト](dynamic-diagram-next-session-prompt.md)は準備稿で、P1完了時に最終版と開始範囲を確定する。そこに書かれた次回P2再開案を、今回のP2開始指示として扱わない。
