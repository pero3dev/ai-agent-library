# 第 3 回レビューの記事修正の一次情報

- 対象: Issue #176〜#188。新規記事は作成せず、モデル仕様・期日・安全性・難易度・参照の既存記述を訂正します。
- 確認日: 2026-10-03(JST)。以下の UTC 時刻は Web ツールの取得バッチ完了直後に clock で取得した時刻で、サーバー側の更新時刻ではありません。
- 確認水準: 公式文書の本文・公式検索要約、論文、ローカルの静的集計。実 API 停止・有料呼び出し・実インシデントは検証していません。
- 過去の research は当時の証拠として保持し、本記録へのリンクを各調査起点に追記します。

## #176 Anthropic の現行モデルと移行

取得バッチ完了: **2026-10-03 14:48:08 UTC**。

| 一次資料 | 確認内容 |
| --- | --- |
| [Models overview](https://platform.claude.com/docs/en/models/overview) | Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 4.5。入出力単価は順に $10/$50、$4/$20、$2/$10、$1/$5 / MTok。公式の開始推奨は Opus 5.5。既定 effort は high / medium / high / 非対応 |
| [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) | cache read の基本は入力単価 0.1 倍、Fable 5.1 / Mythos 5.1 は 0.025 倍、Opus 5.5 は 0.05 倍。read と write を区別 |
| [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations) | Opus 5 / Sonnet 5 / Opus 4.8 は Active の旧世代。最早退役日を確定退役日に読み替えない。Haiku 4.5 の「not sooner than 2026-10-15」も同様。Sonnet 4.5 は deprecated、退役日 2026-11-30 |
| [Migrating to Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide) | 常時 adaptive、既定 medium、強制 tool_choice any/tool の拒否、思考履歴の結び付きを移行対象にする。モデル ID だけの交換で互換性確認済みとしない |
| [Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) | adaptive 既定、high 以下の between_tools、非既定サンプリング値は 400。出力上限・思考と強制ツールの非互換を区別 |

5 サンプルの既定 ID を `claude-opus-5-5` とし、`ANTHROPIC_MODEL` で上書き可能にしました。品質の合格・API 可用性はモックから推論しません。

## #177 13 項目の期日分類

**実施済み**は公式の実施告知がある場合だけです。**確認不能**は公式表に期日が残る、取得不能、または実施日前で実施をまだ確認できない場合です。期日経過だけで実停止を推定しません。延期・撤回の確認済み項目はありません。

| # | 対象と告知期日 | 分類・確認結果 | 一次資料・取得バッチ完了 UTC |
| --- | --- | --- | --- |
| 1 | Copilot Gemini 3.5/3.6 Flash、Kimi K2.7 Code、Opus 4.7 / 2026-10-02 | **実施済み**。全提供面の同日廃止を公式実施告知で確認。移行先 Opus は予告時 5 から 5.5 へ変更 | [10/2 実施告知](https://github.blog/changelog/2026-10-02-selected-models-in-github-copilot-deprecated/) / 2026-10-03 14:26:54 UTC |
| 2 | 同じ Copilot 10/2 分の参考資料・TODO | **実施済み**。参考資料の予告は履歴として明示し、確認済み廃止を未確認 TODO から除く | [10/2 実施告知](https://github.blog/changelog/2026-10-02-selected-models-in-github-copilot-deprecated/) / 2026-10-03 14:26:54 UTC |
| 3 | gpt-5.4-cyber / 2026-10-01 | **確認不能**。終了日は退役表に残り、後継は利用可能な最も高性能な cyber モデルという案内。特定 ID は指定されない。実停止・延期の別は確認できない | [OpenAI Deprecations](https://developers.openai.com/api/docs/deprecations) / 2026-10-03 16:27:48 UTC (再取得) |
| 4 | Bedrock Claude 3 Haiku / 2026-09-10 | **確認不能**。直接再取得では対象行・告知期日が残っています。初回の行削除という読取を撤回。既存 FT 成果物・Provisioned Throughput を含む実停止範囲は未確認 | [Bedrock Legacy lifecycle](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html) / 2026-10-03 16:23:54.154 UTC (直接再取得) |
| 5 | Videos API / sora-2 系 2026-09-24、Nova Reel v1:0/v1:1 と旧 Gemini Omni preview 2026-09-30 | **確認不能**。OpenAI/AWS は告知期日掲載。Google の旧 preview の告知は deprecated であり、API 停止と同義ではない | [OpenAI](https://developers.openai.com/api/docs/deprecations)、[AWS](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html)、[Gemini Changelog](https://ai.google.dev/gemini-api/docs/changelog) / 2026-10-03 14:26:54 UTC |
| 6 | Nova Canvas v1:0 / 2026-09-30 | **確認不能**。AWS 表に期日が残る。実停止・延期は確認できない | [AWS](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html) / 2026-10-03 14:26:54 UTC |
| 7 | Nova Sonic v1:0 / 2026-09-14 | **確認不能**。AWS 表に期日が残る。実停止・延期は確認できない | [AWS](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html) / 2026-10-03 14:26:54 UTC |
| 8 | WorkHQ Design Studio 3.20–3.21 / Digital Worker 2.38–2.39 / 2026-09-30 | **確認不能**。サポート表に終了日が残る。サポート期限と実行停止は別 | [WorkHQ Announcements](https://documentation.blueprism.com/workhq/en-us/announcements/announcements.htm) / 2026-10-03 14:26:54 UTC |
| 9 | Colorado 改訂規則案共有 / 2026-09-23 | **確認不能**。過去の確認期日は保持。今回の公式ページで改訂案公開・延期を確認できない | [Colorado AG AI rulemaking](https://coag.gov/ai/) / 2026-10-03 16:24:41 UTC (再取得) |
| 10 | Copilot の追加廃止 / 2026-10-19 | **確認不能(実施日前)**。公式予告は継続。本文の表は 6 モデル(元 Issue の 7 件という表現と異なる)。期日後に実施・延期と移行先を再確認する TODO | [9/18 予告](https://github.blog/changelog/2026-09-18-upcoming-deprecation-of-selected-github-copilot-models-in-mid-october/) / 2026-10-03 14:49:45 UTC |
| 11 | o4-mini 対象 ID / 2026-10-23 | **確認不能(実施日前)**。公式表に終了予定が残る。期日後の実施再確認 TODO | [OpenAI](https://developers.openai.com/api/docs/deprecations) / 2026-10-03 14:26:54 UTC |
| 12 | 知財本部コード届出開始 / 2026-10-26 | **確認不能**。専用ページの今回取得は失敗。9/10 の確認記録の予定を履歴として保持し、期日前の日程と期日後の開始・延期を再確認する TODO | [内閣官房専用ページ](https://www.cas.go.jp/jp/seisakukaigi/titeki2/ai_principle_code/index.html) / 2026-10-03 14:26:54 UTC(取得失敗) |
| 13 | Colorado コメント期限 / 2026-10-26 | **確認不能(受付終了・延長は実施日前)**。再取得で 8/11〜10/26 の受付を確認。正式審理が続く場合は最終日まで延長。期日後の受付終了・延長を再確認する TODO | [Colorado AG](https://coag.gov/ai/) / 2026-10-03 16:24:41 UTC (再取得) |

## #178〜#182 安全・提供経路

| 一次資料 | 取得バッチ完了 UTC | 確認と本文での限界 |
| --- | --- | --- |
| [PPC 漏えい等の対応](https://www.ppc.go.jp/personalinfo/legal/leakAction/) | 2026-10-03 14:49:45 UTC | 報告・本人通知の入口。個別の要否・法的期限は法務へ。GDPR 第33/34条の EUR-Lex は本文が取れず数値期限を記載しない TODO |
| [OpenAI MCP servers](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) | 2026-10-03 14:49:45 UTC | provider 実行の allowed_tools / require_approval。アプリが直接実行する経路と別。送信先・credential scope も要確認 |
| [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | 2026-10-03 14:49:45 UTC | token passthrough を承認・隔離の代替にしない。stdio 配布物の固定・起動隔離とリモートの定義差分・再審査は実装上の運用方針 |
| [Cursor Run Modes](https://cursor.com/docs/agent/security/run-modes) | 2026-10-03 14:29:56 UTC | Auto-review は毎回承認ではない。allowlist、sandbox、classifier の順序。組織モデル許可・Run Modes 管理で利用可否が変わる。Cloud Agents の権限をこの表から推定しない |
| [Gemini CLI authentication](https://geminicli.com/docs/get-started/authentication/)、[API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)、[API terms](https://ai.google.dev/gemini-api/terms) | 2026-10-03 14:29:56 UTC | API キーによる Unpaid / Paid 経路と data use。旧個人 login の終了は無料 API キーの終了ではない。モデル・地域・課金設定で条件が変わる |

漏えい封じ込め・外部副作用・記憶/取得情報の信頼境界の訂正は設計の整合性確認です。検出器・人の承認・XML 分離を完全な防御とする実証は行っていません。

## #179・#183・#186 設計判断の条件

2026-10-04(JST)の最終編集では、取得済みの NIST AI RMF Core の役割・責任・人の監督・第三者ソフト/データ管理と、OpenAI/MCP の実行・資格情報の境界を参照しました。これらの資料を、V 字工程の費用則、既存コードの仕様の正しさ、画像内命令の検出率、特定の判断質問の優位性を証明する資料とは扱いません。

- 完了の宣言は成果物が要求を満たす証明ではありません。検証器・別の判断者・人の確認で検証結果を扱い、検証できない場合はその状態を残すという、本ライブラリの設計方針です。
- 工程の上下だけでは修正費用は決まりません。影響する利用者・成果物、取り消せる範囲、後で誤りを検出できる条件に応じてレビューを設計します。現行コードの出力は等価性を測る観測事実であり、合意した要求の正しさは別の判断です。
- 自社 runner の配置だけでは推論・認証・索引・ログの送信先は決まりません。③の定義を満たすかは、実際の全データフローを点検して判断します。
- 固定手順の単一路と、入力に応じた固定分岐を判断質問で分けるのは、既存の図と用語を一致させるための説明上の判断です。この分類の性能優位を実証していません。
- 成功率の区間は独立したケースを対象とする二項モデルの条件付き計算です。同じケースの繰り返し、judge の誤り、代表性のないケース選択を標本数だけで解消できるとは扱いません。

難易度と前提リンク、タグの統合は本文を読んだ編集判断であり、外部の製品資料がこのライブラリの学習順を定めているわけではありません。取得日時とアクセス日は 2026-10-03 の実記録を保持し、最終の実質編集日は 2026-10-04 と区別します。

## #184〜#186 数式・法律・評価

| 一次資料 | 取得バッチ完了 UTC | 確認内容 |
| --- | --- | --- |
| [DPO 原論文 v3](https://arxiv.org/html/2305.18290v3) | 2026-10-03 14:33:02 UTC | 元報酬と最適方策の閉形式を、任意の学習中方策の暗黙報酬定義と区別。共通の入力依存定数は報酬差で消える |
| [FlashAttention](https://arxiv.org/abs/2205.14135)、[Positional Interpolation](https://arxiv.org/abs/2306.15595) | 2026-10-03 14:33:02 UTC | 計算と HBM への行列保持は別。RoPE の素の外挿と位置補間・周波数調整は別。全体計算・API 料金を単純な二乗としない |
| [NIST 二項比率の区間](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm) | 2026-10-03 14:33:02 UTC | 正規近似と Wilson。独立ケース・母集団への代表性が前提。judge 誤差や選択偏りを区間が解決するわけではない |
| [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) | 2026-10-03 14:47:12 UTC | GOVERN 2/3 の役割・監督、GOVERN 6 の第三者ソフト・データ。法的責任の結論ではない |
| [EC AI Act Article 14](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14) | 2026-10-03 14:47:33 UTC | 高リスク AI の人による監督、過信への配慮、出力を無視/変更/停止できる手段。すべての Agent に一律適用としない |
| [METI AI 契約チェックリスト](https://www.meti.go.jp/press/2024/02/20250218003/20250218003.html) | 2026-10-03 14:46:52 UTC | 公式検索要約では契約による利益・リスク配分とデータ利用範囲を確認。本文・関連 PDF は 403 / 取得失敗で詳細未確認。本文の法的結論へ使わない |
| [法務省 AI 法務支援資料](https://www.moj.go.jp/housei/shihouseido/housei10_00134.html) | 2026-10-03 の取得試行 | 403 により未取得。従来 9/10 の確認成功日を保持し、個別サービスの適用確認を TODO に残す |

## #187〜#188 機械品質の判断

一次情報による製品調査と、ローカルの品質判断を区別します。

- [前提知識 audit](../../project/records/2026-10-03/prerequisite-level-audit.md): 元の 55 件すべての処置。内容の基準を定義し、任意の発展資料を必須前提から移動。新しいパーサ検査はコード・コメントを除外し、参照形式リンクも検査します。
- [singleton tag audit](../../project/records/2026-10-03/tag-singleton-audit.md): 193 種すべての処置。6 種を代表タグへ統合し、独立した主題は頻度だけで削除しません。
- 参考資料の重複は URL 単位に統合し、確認内容を併記。旧来のアクセス日を新たなアクセス成功とは読み替えません。
- オートメーションバイアスは既存の古典研究が扱う一般的枠組みへ縮めました。LLM 固有の未確認実験を実証結果として残しません。古典論文の今回の DOI / publisher 取得は timeout / error で、以前の確認日を保持します。

## 独立レビュー時の再照合

AWS Legacy 表は 2026-10-03T16:23:54.154Z に直接 HTTP 200 で取得し、Claude 3 Haiku 行・3/10 Legacy・9/10 EOL・6/10 extended access が残ることを確認しました(25,550 bytes、SHA256 `f6db05d014df3db0c19d202161e2ac79fc76dd0c2eda3474791ab001b27c5ff4`)。初回の削除という読取は撤回し、期日経過と実停止を区別します。

Colorado [AI rulemaking](https://coag.gov/ai/) は独立レビュアーが 2026-10-03T16:24:41Z に取得後の実時計を確認しました。8/11〜10/26 のコメント受付と、正式審理が続く場合の最終日までの延長を確認。9/23 の改訂案共有実施は確認不能のままです。

OpenAI Deprecations の再取得時計は 2026-10-03T16:27:48Z。Cyber 後継の特定 ID の断定を撤回し、利用者が利用可能な最も高性能な cyber モデルという公式案内に同期しました。最初の表の「後継」はこの一般的案内を指します。
