# 動的図解の別PCへの引き継ぎ

状態: **作成中。P1完了後の最終引き継ぎではない**。ユーザーはP1全15記事の公開受入まで進めて停止し、その続きは別PCのCodex、GPT-6 Astra、Ultraで進めることを指定した。会話履歴、旧PCの一時フォルダー、認証状態は引き継がない前提とする。

## 依頼と停止境界

本人がPCでじっくり学ぶため、記事本文と一体になった高品質な動的図解を作る。本文や具体例の増量が目的ではない。読む位置に応じた段階表示、手動の前後移動・再生・停止・シーク・拡大を備え、停止中にも意味が読める図にする。SVG・HTMLと既存の共通操作を使い、有料APIや新たな外部サービス登録は含めない。

実装、必要な通常修正、独立レビュー、既存の公開GitHubへのPR、通常CI、マージ、GitHub Pagesの公開確認はセッション内で許可されている。ただし今回の自動作業はP1で止める。次回はそのときのユーザー依頼の範囲を確認してから続行する。新しいタスクを自動作成する依頼ではない。

## 読む順番と正本

1. [AGENTS.md](../../../AGENTS.md)、[CONTRIBUTING.md](../../../CONTRIBUTING.md)、[Git共通規約](../../../harness/git-rules.md)。生成物の直接編集、他者の変更の取り消し、mainへの直接pushをしない。
2. [採択計画](../../plans/engineering/dynamic-diagrams.md)と[199記事の棚卸し](../../plans/engineering/dynamic-diagram-inventory.md)。本文中の「提案」「未着手」は計画採択時点であり、現況は次の展開記録で読む。
3. [展開状況](dynamic-diagram-rollout.md)と最新の制作記録。公開済みの制作単位を最初から作り直さない。
4. [サイトREADME](../../../website/README.md)、[図の登録](../../../website/diagrams/registry.json)、[主要論点の割当](../../../website/diagrams/articles.json)、[記事別受入の検査](../../../website/lib/diagram-article-acceptance.mjs)。

原文は `docs/`、描画は `website/components/diagrams/`、純粋な意味・数値モデルは `website/lib/`、試験は `website/tests/`。本文の段落・式・表・MermaidをMarkdown ASTのまま包装する。本文を図定義へ複製しない。

## 現在地

P1の対象は10章の7記事と11章の8記事。P1の完了は15/15、全学習記事に対して15/199となる。P0で部分対応したAgentループ・Workflow比較の2記事を記事全体の完了数へ加算しない。

現段階ではPR #56までの5記事が歴史的に公開受入済み。推論内部の[PR #57](https://github.com/pero3dev/ai-agent-library/pull/57)は公開機械58件が成功したが、独立画像レビューでラベル修正1件が必要となった。修正版の[PR #58](https://github.com/pero3dev/ai-agent-library/pull/58)は全必須チェックを通過し、`67b1309fcea8267749be6e52881f3d6a4049ae2b` としてマージ済み。同じmain CI・Pages、公開58/58、独立公開レビューapproved / low・must 0を確認し、6記事の公開受入を完了した。詳細は[ラベル修正の公開受入記録](inference-score-label-fix.md)に保存した。現在は `feat/training-reading-diagrams` でC1の2図を制作中。共有入力の変更後はPR #58の6固定snapshotを履歴として保持し、現行版を再受入する。最終停止時に、この節を実際の公開版と15記事の確認結果へ更新する。

次の学習パイプラインと事前学習は[詳細設計](training-storyboards.md)、[機械可読の対応表](training-storyboards.json)、[独立計画レビュー](training-storyboards-review.md)、[独立検査結果](training-storyboards-check.json)を保存済み。2記事7図33段階の計画の承認であり、実装済みの意味ではない。元の機械可読JSONは生バイト、レビューは改行だけLFに正規化して保存し、原本と移管版のhashを詳細設計に記録した。

さらに後続7記事は[詳細設計](p1-remaining-storyboards.md)、[機械可読の対応表](p1-remaining-storyboards.json)、[独立計画レビュー](p1-remaining-storyboards-review.md)、[検査結果](p1-remaining-storyboards-check.json)を保存した。15図71段階と必要な本文訂正の最小置換を含む承認済み計画であり、本文への適用・図の実装・公開受入は未実施。

C2の6訂正に関する[一次資料の確認](../../../research/internals/pretraining-diagram-sources-2026-09-24.md)と[詳細JSON](../../../research/internals/pretraining-diagram-sources-2026-09-24.json)も保存した。2026-09-24の実取得結果であり、本文適用・最終候補レビュー・公開受入の代わりにはしない。移管では改行だけLFに正規化し、元TEMPの所有範囲を記した本文は履歴として保持した。

D1・F2の8論点16置換も、[一次資料の確認](../../../research/internals/p1-remaining-diagram-sources-2026-09-24.md)と[詳細JSON](../../../research/internals/p1-remaining-diagram-sources-2026-09-24.json)に実取得日時と適用限界を保存した。現行beforeの一致を確認した段階で、記事本文には未適用。指定5論文に加え、画像を言語埋め込みへ接続する構成例の直接根拠としてLLaVAを確認した。

## 新しいPCの準備

既存リポジトリ `pero3dev/ai-agent-library` の最新mainを取得し、任意のclone先を作業ルートにする。Git、Node.js 22以降、GitHub CLIを準備し、GitHubの認証は新PCで行う。古い `node_modules`、認証情報、`.git` 内のローカルrunをコピーする必要はない。

リポジトリルートと `website/` でそれぞれ `npm ci` を実行する。ブラウザー検査にはwebsiteのlockfileにあるPlaywrightと、対応するブラウザーを準備する。Edge指定は任意。Pythonが必要な検査の条件はCONTRIBUTINGを参照する。

```text
git status --short --branch
git remote -v
node website/scripts/diagram-coverage.mjs
node website/scripts/diagram-acceptance.mjs
```

上の受入コマンドは、保存された入力版と記録の整合を確認する読み取り専用の検査であり、現在のGitHubや公開サイトを照合するものではない。Gitと公開サイトの状態は別途再確認する。

[公開検証キット](../../../scripts/diagram-release/README.md)と[移管記録](diagram-release-portability.md)を保存した。準備検査と公開実行は別であり、実公開runの成功後に、そのartifactを期待値として使う。

## 1制作単位の進め方

記事の主要論点をすべて棚卸しし、図で扱う段階と、原文の一覧・表で保持する理由を記す。重要な結論を手動操作だけに隠さない。本文が示さない性能値・品質点数・推奨順位を創作せず、概念図と説明用数値を明示する。

意味モデル、絵コンテ、AST対応を固定し、作者以外が確認する。実装後は数値・原文保持・不正MDXの拒否・逆シーク・読書と手動の切替・明暗・狭幅・低いPC画面・縮小モーション・JS無効・印刷表示を検証する。実際の画像と操作を独立レビューし、検証済みの版をPRで公開する。

本文に事実訂正が必要な場合は一次資料を実取得し、[publish-review](../../../.agents/skills/publish-review/SKILL.md)の通常記事変更記録を使う。`harness/changes/` のmanifestを忘れず、候補treeとdigestを固定して別担当が読む。レビュー後の記録追記でもdigestが変わる場合があるため、最終検査まで順序を守る。

PRの全チェック、実merge、main CI、Pagesを確認した後、同じCIのartifactから得たHTMLのハッシュ・BUILD_IDと公開配信を照合する。公開画像の独立確認まで終えてから当該入力版の公開ゲートを記録する。共有入力が変わった既存記事は再受入し、旧版の記録はPR別スナップショットに残す。

## 引き継ぐ検証の限界

静的・単体・ローカルブラウザー・実GitHub・公開配信・実機の確認を区別する。ChromiumやWebKitの端末幅エミュレーションを、物理iPhone Safariの確認と呼ばない。実スクリーンリーダー、物理印刷、本人の学習効果も未実施なら成功扱いにしない。

推論内部のWebKitは初回167件中165成功、その後、スクロール安定待ちを補った表示7ケースが成功した。初回失敗2件を含む限定再検証であり、167件すべてをもう一度実行したという意味ではない。詳細は[推論の制作記録](inference-reading-diagrams.md)を参照する。

推論記事の既存チェックリストを設計証拠中心へ改訂する提案は、独立レビューのshould 1件として残った。今回の訂正による不具合ではなく、本文を増量しない目的から見送った。将来の本文改訂候補であり、P1完了のmustではない。

## 最終停止時の確定作業

最終PR・merge SHA・tree、作業ブランチと未保存差分、15記事のinputDigestと各受入、CI run・attempt・job・artifact・deployment、BUILD_ID、公開HTML hash、確認日時、実画像レビューをこの入口からたどれる形で保存する。旧PCのTEMPだけにある設計・検証ツールは必要な最終版を移し、実行に旧絶対パスを要求しない。生ログの過去の絶対パスは書き換えて証拠を改変せず、必要なら別の相対索引を付ける。

[貼り付け用プロンプト](dynamic-diagram-next-session-prompt.md)を準備した。P1完了時に、次回の開始範囲と残件を含めて確定する。現時点ではP2以降へ着手しない。

準備文書は[独立レビュー](dynamic-diagram-handoff-draft-review.md)と[追補確認](dynamic-diagram-handoff-draft-review-addendum.md)で、旧PCの必須依存・参照の到達性・計画と実装の状態区別を確認した。追補後の残件はmust 0・should 0。これは準備文書の判定であり、P1の最終公開受入や移管ツールの後継コード承認ではない。レビュー記録は改行のLF化と、欠けていた末尾LFの追加だけを行って保存した。
