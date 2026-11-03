# TypeScript 段階移行計画

作成日: 2026-11-03(JST)。状態: **提案・実装未着手**。

調査基準: `405e29273a7a3257adeb370c6ac3196d35693d4d`。この計画は作成時点の構成を対象とする。着手時に差分と依存の解決版を再確認する。

## 判断と推奨範囲

**TypeScript 化は実現可能で、サイトと複雑な運用データの保守に効果が見込める。サイトから始め、Node.js の内部処理へ段階的に広げることを推奨する。** 一括改名は行わず、各段階を既存の実行・公開経路を維持して提出できる単位にする。

当面の到達点は、サイトの自前 UI、データ処理、運用スクリプトの主要な契約を型検査する状態である。互換 CLI、フック、設定、CJS アダプターは必要に応じ JavaScript のまま型検査し、残置理由を管理する。拡張子を全件 TypeScript にすることを完了条件にしない。

Next.js と Nextra は TypeScript の導入経路を提供している。ただし、現在の公式資料とこのリポジトリの固定版は同一とは限らず、コンパイラーの選定には実ビルドの確認が必要である。[Next.js の公式資料](https://nextjs.org/docs/app/api-reference/config/typescript)、[Nextra の公式資料](https://nextra.site/docs/advanced/typescript)、[今回の根拠と限界](../../../research/typescript-migration-2026-11-03.md)を参照する。

## 今回の作業契約

- 目的: 実現可能性、影響、リスク、期待効果、実装順、工数、検証、復旧と完了条件を、現在のコードに基づいて具体化する。
- 許可根拠: ユーザーの「まずは実現可能性や影響、リスク、効果などを考慮しながら詳細な計画を立案」という依頼。今回の変更は計画・調査・索引・作業記録に限定する。
- 所有ファイル: 本計画、[計画作成記録](../../records/2026-11-03/typescript-migration-plan.md)、[棚卸し JSON](../../records/2026-11-03/typescript-migration-inventory.json)、[一次資料の調査記録](../../../research/typescript-migration-2026-11-03.md)、`project/README.md`、`research/README.md`。
- 適用規約: [AGENTS](../../../AGENTS.md)、[ROADMAP の作業入口](../../../ROADMAP.md#作業に応じた入口)、[計画索引](../../README.md)、[調査・運用文書の規約](../../../harness/writing-rules.md#調査記録と運用文書)、[検証手順](../../../CONTRIBUTING.md#提出前のセルフチェック)。サイト・ハーネスの詳細を参照し、学習記事テンプレートは適用しない。
- 必要な検証: 棚卸しの集合と件数、索引と相対リンク、Markdown、ルートの依存準備と `npm run check`、計画の独立レビュー、差分の範囲確認。
- 終了条件: 実装担当が最初の作業単位と合否基準を特定でき、提案と観測結果、未検証の互換性を区別した計画を保存する。
- 外部操作: 公開一次資料の読み取りと、既存 lockfile による検証依存の準備まで。実装、依存定義変更、commit、push、Issue・PR 作成、merge、公開、定期タスク変更、有料 API 利用は今回の範囲に含めない。

## 現状と移行対象

Git 追跡中の JS/TS 系ファイルを集計した。行数は空行・コメントを含む物理行数で、依存、生成物、圧縮された過去証跡は含まない。追跡された TypeScript ソースと tsconfig は現時点でない。

| 領域 | ファイル数 | 行数 | 扱い |
| --- | ---: | ---: | --- |
| `website/app/` | 13 | 391 | 初期移行。ページ・layout・metadata |
| `website/components/` | 24 | 1,112 | 基本表示から開始し、音声・図へ展開 |
| `website/lib/` | 15 | 1,002 | ブラウザー処理と Node 処理を区別 |
| `website/scripts/` | 7 | 811 | 生成・ビルド・配信。CJS 入口は例外候補 |
| サイトの設定・MDX 入口 | 3 | 126 | `mdx-components.js`、Next・Playwright 設定 |
| `website/tests/` | 26 | 2,622 | unit 14本、browser 12本。対象と同時または直後に移行 |
| `scripts/` | 47 | 6,254 | CLI 25本、lib 15本、audio 7本 |
| `tests/` | 30 | 6,030 | unit 28本と helper 2本 |
| Codex・Claude フック入口 | 4 | 16 | 互換性を優先。初期は `.mjs` 維持 |
| 自前の現行コード合計 | **169** | **18,364** | 型検査と移行の管理母集団 |
| `website/vendor/` | 1 | 26 | ローカル CJS 互換パッケージ。初期対象外 |
| `project/` 内の過去の JS 証跡 | 6 | 509 | 履歴として保持。移行対象外 |

全体の観測は176ファイル・18,899行である。上の169ファイルのうち56ファイル・8,652行はテストと helper であり、改名量の多くを占める。各パス、区分、行数は[棚卸し JSON](../../records/2026-11-03/typescript-migration-inventory.json)に保存する。

ルートとサイトは別 package・別 lockfile で、workspaces 構成ではない。ルートに TypeScript の直接依存はなく、サイトの lockfile にある `typescript@6.0.3` は peer 導入で、明示した開発基盤ではない。サイトの解決版は Next 16.3.8、Nextra/theme 4.6.1、React/React DOM 19.3.0。`@types/node`、`@types/react`、`@types/react-dom` は両 lockfile にない。

Python サンプル6件、PowerShell、Markdown/MDX 本文、JSON/YAML/TOML の設定や JSON Schema はそれぞれの形式を維持する。Python の TypeScript への翻訳、TypeScript 教材の新設、サイト機能追加、リポジトリの workspace 化、フレームワークの major 更新は別の作業とする。

## 効果と費用の見方

| 領域 | 期待効果 | 効果の限界・費用 |
| --- | --- | --- |
| React/Next | props、context、ref、非同期 params、null 状態の誤りを変更時に発見しやすくする | CSS・画面崩れ・アクセシビリティは実画面の検査が必要 |
| 生成データ | 記事メタデータ、章・タグ・用語・鮮度、音声 catalog の producer/consumer のずれを検出 | 外部 JSON と front matter は実行時検証も必要 |
| 運用状態 | run/attempt/status、排他所有者、音声制作・公開状態の不正な組合せを表現しにくくする | 排他競合、GitHub の実状態、外部公開は型では証明できない |
| Markdown/MDX AST | node 種別を絞り、存在しない属性へのアクセスや変換の誤りを検出 | 安全性・SVG・CSP の既存検査を維持する |
| 開発・Agent 編集 | 補完、参照追跡、変更影響の確認を支援 | 型の設計・保守とコンパイラー更新への追随が増える |

表示速度向上、bundle 縮小、障害削減率の数値は約束しない。`import type` とビルド後の JS budget を確認し、型付けによる実行時の振る舞い変更を抑える。

P0で同じマシン・Node・lockfile の基準値を取り、P1/P3後に比較する。記録するのは型検査の初回/再実行時間、check/build の時間、生成 route/asset の件数、既存 JS budget、移行中に型検査が検出した問題と分類である。3回以上の実行の中央値を使い、CI 待ち時間と API 待ち時間を分離する。工数には調査・型設計・検証・レビュー・修正を含める。

## 技術方針

### サイトと Node の実行方式を分ける

| 方式 | 適性・制約 | 推奨判断 |
| --- | --- | --- |
| Next 標準の `.ts/.tsx` と別の型検査 | JSX と bundler の処理を既存ビルドへ委ねる | サイトの標準方式として採用候補 |
| Node 標準の型除去で `.mts` を実行 | 実行時 npm 依存を追加しない。型検査は別途必要。変換が必要な TS 構文や tsconfig の paths に制約 | Node の内部実装の第一候補。最低対応版の実試験後に採択 |
| `.mjs` + JSDoc/`checkJs` | パス・実行方式を維持しながら検査可能 | フック・互換入口と初期導入で採用候補 |
| `tsx` などの runner | JSX 等の処理に便利だが実行時にインストールが必要 | 全体の必須 runner にはしない。必要性がある限定範囲だけ比較 |
| `tsc` で別ディレクトリへ emit | 広い TS 構文を使えるが、ビルド前 CLI、root 解決、生成物管理が変わる | 今回の第一候補にはしない。標準型除去で成立しない場合の再設計案 |

Node の型除去は型検査を行わず、tsconfig を実行設定として読まない。`.mts` は ESM として扱われ、相対 import の拡張子を明示する必要がある。[Node.js の公式仕様](https://nodejs.org/docs/latest-v22.x/api/typescript.html)に従い、`enum`、parameter property、実行コードを持つ namespace、tsconfig の paths に依存する設計を避ける。

ルート package には `type: module` がないため、それを全体へ追加する変更を移行に混ぜない。Node 側は `.mts` を基本候補とし、既存の `.mjs` CLI を薄い互換入口にする場合は、内部 module の import で従来の CLI main 判定が実行されなくなる点を扱う。`main(args)` を明示して終了コード・標準出力・例外処理を保つ。`.mjs` と `.mts` の双方に業務ロジックを複製しない。

### 型検査の構成案

- ルート Node 系は `scripts/tsconfig.json` を置く案を第一候補とし、対象を `scripts/` と `tests/` の移行単位に限定する。root 直下の tsconfig が必要になった場合は、`harness/structure.json` と `harness/profiles.json` の許可ファイルも同期する。
- `website/tsconfig.json` は Next UI と MDX 入口用、`website/tsconfig.node.json` は Node 専用ツール用、`website/tsconfig.browser-tests.json` は Playwright 用という責務分離を候補とする。共有ソースが両実行面で使われる場合は両方から検査する。最終的な include/exclude は P0 の依存グラフから確定する。
- `strict` と `noEmit` を基本にし、併存のため `allowJs` を使う。既存 JS への `checkJs` は対象を限定して広げる。`allowJs` だけで読み込まれた JS を検査完了に数えない。import で対象が広がるため `tsc --listFilesOnly` 等で実際の検査集合も照合する。[allowJs](https://www.typescriptlang.org/tsconfig/allowJs.html) と [checkJs](https://www.typescriptlang.org/tsconfig/checkJs.html) の役割を区別する。
- Node 用は `module/moduleResolution: NodeNext`、`verbatimModuleSyntax`、`erasableSyntaxOnly`、明示拡張子と `allowImportingTsExtensions` を候補にする。`target` は最低対応 Node で動く JavaScript に合わせる。ブラウザー用の module 解決設定を Node へ流用しない。
- `noUncheckedIndexedAccess` と `exactOptionalPropertyTypes` は新規の小さなデータ契約から試し、全体適用の追加工数を P0 で測る。`strict` だけで両方が有効になるとは扱わない。
- `any`、`@ts-ignore`、`@ts-nocheck`、広い型キャストで合格させない。一時例外は対象・理由・所有者・解消条件を記録する。`skipLibCheck` が必要な場合も対象と理由を記録し、自前コードの除外や `ignoreBuildErrors` による合格と混同しない。

compiler と必要な `@types` は各 package の直接 devDependency に固定し、両 lockfile を管理する。まず現行 peer の TypeScript 6.0.3 と固定 Next/Nextra の互換性を調べ、成立しなければ互換版を比較する。取得した現行 Next 資料には TypeScript 7 と compiler API の違いがあるため、最新版の一括採用は前提にしない。`@types/node` は最低対応 Node 22 の API に合わせ、React の型は React 19 系との整合を検査する。型不足のライブラリだけ対応する型パッケージを足し、包括的な `declare module '*'` は使わない。

### データ境界と生成物

最初に契約を設ける候補は `PageMetadata`、`Section`、`GlossaryEntry`、`AudioCatalog`、`PlayerSnapshot`、`ValidationIssue`、`RunState` である。学習記事の front matter、CLI 引数、JSON/YAML/TOML、localStorage、GitHub 応答、子プロセス出力は検証前の `unknown` として扱い、既存の検証を通した値と分ける。

JSON Schema は保持する。既存 schema と型を二重保守する箇所は対応関係と一致の確認方法を設け、schema からの型生成を新たに導入するかは独立して判断する。`JSON.parse(...) as Foo` で検証を代替しない。不正入力の試験では正常型への偽装を避ける。

型定義の正本は手書きコード側に置く。`website/generated/` の JSON、loader、`website/content/` の MDX、`next-env.d.ts`、`.next/types`、静的出力は引き続き生成物であり、手編集・Git 追跡しない。空 catalog や JSON の値推論だけから公開データ契約を決めない。

サイトのクリーン検証では **sync → Next の型生成 → 型検査 → build/既存 postbuild** の順を成立させる。syncのMermaid SVG生成にはPlaywrightのChromiumが必要なため、ブラウザー依存も準備する。固定 Next の `next typegen` が現在の設定・生成コンテンツで動くかを P0 で確認する。成立しない場合は初回 build 後に型検査する手順を明示する。生成型を追跡して順序問題を隠さない。root 型検査は website の生成完了に依存させない。

## 影響と主なリスク

| リスク | 影響・確度 | 対策と受入条件 |
| --- | --- | --- |
| CLI の依存ゼロ契約を失う | 高。`tests/unit/freshness-run.test.mjs:614` 以降は依存なし checkout で実 CLI を検査 | native 型除去または JS 維持。`inspect/prepare/save/resume`、フックの npm 未導入経路を実行する |
| フックの起動拒否 | 高。`scripts/lib/hook-command.mjs` と両製品設定が `.mjs` パス、実体、marker を検証 | 初期は入口/core を維持。変更時は正常・拒否・不正 marker・Windows exit 2 と実 Agent 発火を確認 |
| policy の信頼境界を壊す | 高。policy workflow は trusted base を checkout し `npm ci --ignore-scripts` | 候補側の compiler/loader/config/emit を trusted 実行へ持ち込まない。reviewer guard の許可を緩めない。原則 JS を維持 |
| `.mjs` の固定参照漏れ | 高。package scripts、検証一覧、CI、PowerShell 起動、fixture コピー、単体試験に波及 | 旧→新→参照元を単位ごとに列挙し同じ PR で同期。履歴証跡は置換しない |
| ESM・main 判定・root 解決の変化 | 高。`tooling-common.mjs`、`md-utils.mjs` 等が `import.meta.url` に依存 | dist 出力を初期採用しない。cwd 非依存、子プロセス、両拡張子、Windows パスを検査 |
| Next/Nextra/compiler の版不整合 | 中〜高。peer compiler と直接依存の区別が必要 | 固定版で実型検査・静的 build を試し、版と根拠を固定。major 更新を同居させない |
| Mermaid/MDX の拡張子 alias | 高。`website/next.config.mjs:7` と `mermaid-render.test.mjs:15` が `.jsx` を固定参照 | renderer 改名と alias・試験・案内を同期。Next build と Turbopack dev の双方を確認 |
| JSON の型付けで検証を省く | 高。音声、鮮度、公開判定に外部入力がある | unknown→検証済み型。空・欠損・旧版・不正入力を既存試験で維持 |
| DOM・音声・AST の型を過剰単純化 | 中。null/ref、MediaSession、偽 audio、MDX node に差がある | 判別可能な union と必要操作の interface を使う。既存の再生、CSP、SVG 試験を維持 |
| 新しい検査が CI から漏れる | 高。検査一覧が command/cwd を照合し、policy も固定チェックを使う | 既存 harness/build job に型検査を組み込み、同名11必須チェックを維持。新ジョブ必須化は別判断 |
| 型検査対象が見かけ上増えるだけ | 中。未検査 JS や除外が残る | TS/検査済みJS/併存のみJS/互換例外/対象外を分け、実検査集合を台帳と照合 |
| 長期移行と並行変更の競合 | 中〜高。169ファイルにテストを含む | 小さな PR、領域所有、改名と機能変更の分離。各段階で main 差分を再棚卸し |

## 実施段階と依存関係

工数は1人日の実作業を6〜8時間とする初期見積もりで、実装・検証・レビュー修正を含む。CI待ち、公開待ち、実機や認証の準備、承認待ちは含まない。現在の型エラー件数は未測定のため確約納期にはしない。

| ID | 所有範囲・作業 | 依存 | 完了条件 | 初期工数 |
| --- | --- | --- | --- | --- |
| P0 | 固定版・依存グラフ・生成順・Node 実行方式の検証。基準値と例外台帳を作る | 計画採択と実装依頼 | 最低対応 Node と CI 相当で小さな `.mts` と `.mjs` 呼出しを確認。Next/compiler の実型検査・clean build、型導入の診断件数を取得。採用方式と再見積もりを記録 | 2〜3人日 |
| P1 | サイト型基盤と小さな縦断移行。`home/data.js`、単純表示 component、記事 route/MDX の代表経路 | P0 | clean checkout で型検査・unit・静的 build 成功。代表ページが同じ route/metadata/表示を保つ。残りJSを併存可能 | 2〜4人日 |
| P2 | 記事/章/タグ/用語/鮮度/音声 catalog の契約と残りの基本 UI。`sync-content.mjs`や`audio-catalog.mjs`等の必要なproducerもTSまたはJSDoc/checkJsで検査 | P1 | producer→JSON→consumer が同一契約で検査され、空・欠損・不正入力も試験。全 route の生成と検索を維持 | 3〜5人日 |
| P3 | 音声 context/player、DOM ref、Mermaid/MDX AST、React Flow と対応試験 | P2 | 音声・SVG/CSP・JS無効時代替・メニュー/検索・a11y の既存回帰が成功。alias と生成物保護を維持 | 4〜7人日 |
| P4 | Node の純粋な文書解析、ValidationIssue、レポート、CLI引数と設定読込。互換入口を維持 | P0。共有契約がある部分は P2 | root型検査/check、npm未導入CLI、子プロセス、cwd/Windowsパス試験成功。新入口の終了コードと出力形式を比較 | 3〜5人日 |
| P5 | harness/freshness の run/attempt、排他・再開、GitHub証跡、音声制作・公開データ | P4。サイト音声と共有する部分は P3 | schema・永続状態の互換性、競合/再開/旧入力の試験、Windows限定試験が成功。実GitHub操作は別途許可された受入で照合 | 5〜9人日 |
| P6 | 残るテスト/helper、P2/P3で扱わなかったサイトNodeツール・入口・設定の型検査。フック/policyのJS維持・移行判断と例外確定 | P3/P5 | 未分類0件。全対象がTSまたは明示して検査するJSとなり、互換例外の根拠と検証が揃う。必要な最終CI・公開確認を完了 | 2〜4人日 |

合計は **21〜37人日**、不確実性の予備20〜30%を含めた予算枠は **26〜49人日** を目安とする。サイト中心の P0〜P3 は11〜19人日、予備込み14〜25人日が目安である。P1だけで費用対効果を再評価し、サイト中心で止める判断も可能にする。新規の不具合修正、フレームワーク更新、実フックの全面改設計が必要なら、この枠へ黙って含めず追加見積もりにする。

P1〜P3 と P4 は P0 の方式確定後に分担できる。サイト担当、Node担当、CI/契約担当を分け、package/lockfile と共有型・検証一覧の編集責任者を1人にする。少人数なら直列で進める。2人に増やしてもレビュー・共通設定・実画面確認があるため単純に半分の暦日にはならない。

各段階は1〜複数の小さな PR に分割し、1 PR を1つのデータ経路または実行契約に絞る。テストを終盤にまとめて改名するのではなく、変更した API のテストは同じ単位で同期する。P6は残りの整理を担当する。

## 最初の作業単位

次に実装を依頼する場合は **P0だけを最初の契約** にする。

1. 着手時の HEAD・dirty 状態・Node/npm・lockfile を保存し、[棚卸し](../../records/2026-11-03/typescript-migration-inventory.json)との差を確認する。既存の障害は移行による回帰と分ける。
2. サイトと Node の依存関係、固定拡張子参照、生成順、実行時 npm 非依存の経路を対象ファイル単位で台帳化する。
3. 隔離した検証用 checkout/作業領域で compiler と型依存を直接指定し、代表UI、生成データ、Nodeの小さな純粋関数、`.mjs`入口から`.mts`を呼ぶ経路を試す。製品コード全体の改名は行わない。
4. `.node-version` の最低対応22.22.2、対応24系、CIの22系で実行方式を確認する。通常check用の環境と、`node_modules`のないfixtureを分ける。利用できなかった面を成功扱いにしない。
5. 固定 Next/Nextra で compiler の候補、Next 型生成、生成 JSON の取得順、checkJs の広がり、型エラーの分類と例外必要性を測定する。
6. 設定配置、依存の版、型検査コマンド/CI位置、JS残置方針、P1の所有パス、工数再見積もりを記録し、独立レビューを受ける。

P0の採択条件は「型検査が動く」「依存ゼロ CLI と trusted policy を守れる」「サイトの実ビルドが成立する」「P1以降の作業量が把握できる」の4点である。成立しない場合は、該当領域を JS+JSDoc に残すか方式を再検討し、他領域の成果まで失敗扱いにしない。

## 検証と受入

次は実装時の必須検証案であり、今回実施済みの結果ではない。今回の実績は[計画作成記録](../../records/2026-11-03/typescript-migration-plan.md)に分離する。

| 検証面 | 手順・対象 | 合格の意味 |
| --- | --- | --- |
| 型 | 各 package に新設する `typecheck`。root Node、Next UI、サイトNode、browser tests の実検査集合を照合 | 対象コードの型エラー0。対象外/未検査JSを含めて全件成功としない |
| 共通 | ルート `npm ci` → `npm run check` | 既存単体・文書・リンク・ハーネス・構造・形式設定の成功 |
| コマンドとCI | `npm run check:ci` の一覧、`harness/verification.json`、workflow、package scripts を照合。CI変更は Actionlint/policy も検査 | 一覧表示は実行結果と区別。必要な型検査が既存必須jobに含まれる |
| Windows/起動 | `npm run test:harness:windows`、依存なしfixture、実子プロセス、cwdの異なるCLI | パス・終了値・排他・中断再開と入口の互換性 |
| 互換ハーネス | 正本変更時は `node scripts/sync-harness.mjs --write` → `--check`。フック変更時は実Codex/Claudeも別途確認 | 生成の一致と、実クライアントでの発火を別々に証明 |
| サイトunit | `website/` で `npm ci` → `npm test`、該当パイプライン試験 | loader、実Nextra compiler、MDX guard、音声状態等の回帰防止 |
| サイトbuild | Chromiumを準備し、CI相当の `STATIC_EXPORT=1`、`NEXT_PUBLIC_BASE_PATH`、`NEXT_PUBLIC_SITE_URL`を公開先に合わせて設定し、`npm run build:clean` | sync、SVG、Next export、Pagefind、全route、canonical/OG、sitemap/CSP/JS budgetを維持 |
| devとブラウザー | `npm run dev` のTurbopack確認、`npm run test:browser`。CIのChromium/Ubuntu Firefoxと音声専用fixture、macOS WebKitの該当job | ビルドで検査しきれない表示・操作・再生。fixtureをPages成果物へ混ぜない |
| 公開 | 公開する段階ではPR headの11必須チェック、merge SHA、main CI、Pages deployment、代表route・assetと公開本文を対応付ける | ローカル成功、CI成功、公開成功を分ける |

既存の必須チェックは `scripts/lib/github-policy.mjs` が定義する11件を維持する。初期は型検査を既存 harness/build job 内へ入れ、GitHub branch protection の変更を前提にしない。必須チェック名や信頼境界を変更する場合は、別の設計・実設定の読戻しを必要とする。

既存の視覚・音声fixtureを再利用する。追加試験は型契約の不正な利用、外部データの検証、入口/loader互換性など、移行で新たに生じる境界に絞る。実行時の「型除去成功」と「型検査成功」は別々に記録する。WebKit試験を実機Safari/iPhone/AirPodsの成功に読み替えない。

## 完了の定義と継続判断

各ファイルに `typescript`、`checked-javascript`、`interop-only-javascript`、`compatibility-exception`、`out-of-scope` の区分を付ける。開始時の169ファイルを基本母集団とし、追加・削除・分割も履歴を残す。テストと実装の割合、検査済み割合、例外数を別々に報告する。

P1時点では型検査の追加費用と検出した問題を比較し、P3時点ではサイトを一区切りとして効果を評価する。既存check/build時間が同一条件の基準より20%以上増えた場合、または一時例外が増え続ける場合は、次の範囲拡大前に原因と改善案を検討する。この20%は暫定の運用判断基準であり、実測効果の主張ではない。

全体完了には次のすべてを満たす。

- 自前 UI と主要データ契約・運用状態が型検査され、未分類・意図せぬ未検査が0件である。併存するだけの JS は移行途中として扱う。
- JSを残す入口・設定・CJS・policy・フックは理由、所有者、検査方式、実行互換性の証拠を持つ。変更していない外部vendorと過去証跡は母集団から除く。
- 既存CLIのパス/引数/終了値、依存未導入経路、JSON/schema/永続状態、記事と公開URLを維持する。
- 一時的な型抑制を解消するか、恒久例外として根拠をレビューし、型検査を既存CIで継続する。
- 必要な最終内容の独立レビュー、CI、公開した変更の公開確認が揃う。未実施の実機・実Agent・外部操作は残件として明示する。

## 復旧と中断再開

各PRの前に所有範囲の基準commitと検証結果を保存する。移行と機能改修を分け、未mergeの変更は所有差分だけを戻せる形にする。merge後に回帰があれば該当PRをrevertする修正を作り、同じ検証を通す。無関係なdirty変更、既存run、snapshot、過去のdigest・証跡を上書きしない。

runner/設定を戻す単位には、package/lockfile、import、互換入口、検査一覧、workflow、alias、必要な生成互換設定を含める。生成済み `.next` 等の削除だけでは復旧したと扱わない。公開済みの場合は復旧後のmain CI・deployment・公開画面まで照合する。

中断時は段階ID、対象/所有パス、実検査集合、採用版、検証結果、例外、残件、次のコマンドを小さな作業記録へ保存する。進行中の長期runが旧CLIを参照する場合は、そのrunを完了または所有者と調整するまで互換入口を除去しない。
