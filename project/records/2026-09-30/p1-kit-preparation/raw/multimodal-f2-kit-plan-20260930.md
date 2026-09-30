# F2 マルチモーダル — 検証キット計画案

2026-09-30。担当 `/root/pretraining_visual_review`。所有はこのMD/同名JSONのみ。**計画のみ**で、記事・製品・kit・登録・Gitを変更しない。F1正式公開受入、独立計画レビュー、root開始指示後に実装する。F2を含むP1全15記事の公開受入後、別PC引き継ぎを完成して停止し、P2へ進まない。

## 正本・訂正・未確定の証拠

採択仕様は `project/records/2026-09-30/p1-interface-preparation/raw/multimodal-f2-interface-proposal-20260930.md/json` と同rawのinterface review（approved、must0/should1）、台本は `project/records/2026-09-24/p1-remaining-storyboards.json` のF2。本文訂正の正本は `research/internals/p1-remaining-diagram-sources-2026-09-24.json` の対象記事M訂正。rootの `TEMP/multimodal-f2-correction-precheck-20260930.json` と `TEMP/multimodal-f2-primary-recheck-20260930.md` も参照し、現物hashを本JSONの `evidenceInputs` に保存する。

訂正は **`docs/10-llm-foundations/multimodal-models.md` 1記事内の13置換**（M1〜M5＋関連8か所）。13記事ではない。M1〜M3は構成例の範囲、M4系は解像度/内部表現/課金の非同一性、M5系はOCR等の情報保持・精度/費用の条件付き比較をそろえる。全13の一意一致とメモリ上の候補hashを独立に再計算する。

現在の本文hashは `151625bf…`、13置換後**日付変更前の計画候補**は `27956431…`。完全値はJSONに記録する。これは実適用ではない。実装時はrootが再度一意一致を確認して13置換と実改訂日を適用し、**ROADMAP AR-2に対応する通常記事変更manifest・タスク全成果物・最終候補tree/digestの正式独立記事レビューを済ませてから両図を有効化**する。interfaceのshouldにある曖昧な「T-task manifest」は採用しない。

最終の実改訂日・記事/AST/source/input digest・承認treeは**すべてnullで保留**。日付前の候補digestを正式版に流用せず再計算する。rootの2026-09-30一次資料取得はrootの記録として扱い、この計画の新規取得・料金実測・正式記事承認とはしない。

実在runnerは **D2候補121ケース/10 routes**。将来F1の **177ケース/14 routes**も実物・commit/tree・callback本文・全proof hashはnull。F1公開受入後に厳密凍結し、現在121や計画値を実行証拠へ読み替えない。

## 新14ケースと計数

| 種別 | 件数 | 内容 |
| --- | ---: | --- |
| 全段階・画面条件 | 6 | 1440×1000明/暗、1280×720明、390×844明/暗、960×540明DSF2 |
| 各図の意味 | 2 | 独立literal、構成範囲、来歴、全設定、境界と可視geometry |
| keyboard / modal | 1 | 両図、全有効設定、状態独立、focus復帰 |
| READ | 1 | 全9停止点往復、未操作でも留保が見える |
| native playback | 2 | 各図の進行・pause・replay・完了 |
| noJS / chunk fallback | 1 | noJS1＋図別の実chunk遮断2context |
| print | 1 | scene意味と操作非表示を分離 |

**177+14=191ケース、14+1=15 artifact routes**。新routeは `/docs/llm-foundations/multimodal-models`。F1登録直後・既存favicon前に連続14blockを追加する予定で、正確なindexは実物凍結後に決める。新blockと承認済み追加を取り除けば旧177の名前/順序/本文が一致する。

1engine当たりprofile整数は6×(5+4)=54、既定中点往復は2方向×3点(.49/.50/.51)×(4+3)=42。入力図をfine/structuredにした全3境界の往復18も確認する。有効選択は2@S1＋4@S2=6、保持設定gridは2×4×4段階=32、READは9×往復=18。model側は入力図8設定×3境界×6観測=144、表現図4境界×6=24を別に扱う。観測数は14登録内の内訳で、画像数・追加ケース数ではない。2図9段階はすべてREAD、手動専用なし。

## 独立literalと意味

| 図 / marker | 段階 | 操作 |
| --- | --- | --- |
| `multimodal-representation` / `MULTIMODAL / REPRESENTATION` | 5、READ0〜4 | なし |
| `multimodal-input-tradeoffs` / `MULTIMODAL / INPUT` | 4、READ0〜3 | granularity coarse/fineはS1、inputPath image/roi/ocr/structuredはS2のみ |

期待値は採択仕様と**訂正後の本文**から独立に書き、製品model/fixtureをimportしない。JSONに固定ID/段階名/未知値/件数、局所可視geometryと19群の負例を置く。inactive設定はnullで保持値の影響を受けず、UIも該当段階だけ表示する案。入力方式の選択は強調だけで、4経路のラベルや留保を隠さない。

**表現図。** S0から「この構成例」の限定とテキスト/画像/音声の3入口を表示する。S1はテキスト埋込、画像変換、音声変換を分け、同じ形を同じ意味・全モデル共通の実装としない。音声には画像patch由来を付けない。

S2の**2×3＝6パッチは説明用の配置**。`patch-0`〜`patch-5`が格子から列へ移る間、S2〜S4でsourcePatchIdと6つの由来表現を一対一に保つ。実encoder長・課金token数ではなく、料金換算もしない。S3は2つのテキスト由来カードと6つの画像由来カードをこの例の系列へ接続する。合計8枚も模式構造であり、実トークナイザの出力ではない。音声は別変換経路として可視に残し、構成依存の接続と示す。S4の質問表現→画像由来表現の線は模式的関係であり、注意重みの実測・回答文・画像理解の成功を作らない。出力は `generated-text-pending` のままにする。

**入力図。** S0は同じ入力から表現へ、必要な細部が残るかを問う段階で、観測済みの合否にしない。S1は小さな文字・密な表・位置関係・数え上げの**4種類を全表示**。coarse/fineは模式的な粒度だけを変え、「細かい→必ず保持/高精度」としない。見えない細部のもっともらしい補完と、重要箇所を検証する留保を残す。

S2は解像度・枚数・利用動画フレームの**3仕様/測定観点**と、画像全体・関心領域・OCRテキスト・構造化データの**4経路を同時表示**する。全経路は `input-source` 由来。ROIは領域IDと元画像内の切出しgeometryを保持し、OCR/構造化も来歴と、位置/外観/認識誤りを確認する条件を持つ。面積から保持率を算出せず、OCRが常に安い/正確、画像は最後の手段、解像度＝token数＝料金としない。price/latency/retention/quality/tokenCountは未知のまま。

S3は入力理解→テキストと、画像/音声生成の**2能力枠を分け、各枠1個ずつ対応未確認**を表示する。「読める⇒作れる」の保証線や製品対応判定を置かない。一構成のテキスト出力から、全理解モデルがメディア生成できないとも結論しない。

IDだけでなく、その欄の可視文言・経路・件数を照合する。hidden title/descや別欄の同じ語では代用しない。格子の行列、来歴線、ROIの包含、音声経路、能力の境界を同一座標系で観測する。水平strokeは高さ0だけで不可視にせず、bbox衝突候補は実画像の字形で判断する。新しい実数値・架空の保持率・価格・成功率は一切期待値に作らない。

## 原文・fallback・実視認

訂正候補はroot43、H3 9、内容body18、包装H3 6/body14、42論点＝動的27＋静的15。概要表は1つ（header1＋body4行、3列、15cell）。list12/listItem42/link25、数式・code・Mermaidは0。TODO blockquote2つは既存装飾で**aside2・通常blockquote0**になり、うち1つは入力図の本文内にある。原文表・リンク・順序は保ち、図/TOC/静的説明やGlossary装飾を原文件数へ混ぜない。

実訂正/日付/AR-2レビュー後のASTを正本として、全4図有効化組合せが復元することを確認する。訂正前ASTへ戻す検査にせず、宣言された13置換と日付以外の変更を区別する。原数式があれば保持するが、現候補は0なので数式を追加しない。

fallbackは1case内の**noJS1＋対象別chunk遮断2の計3fresh context**。noJSは原文/h1/表と全9静的説明。chunk失敗は対象`DiagramBoundary`の読込失敗/本文継続status、原文/h1/表、原数式の保持を確認し、失敗sceneの静的説明数は要求しない。静的リストはscene内`ReadingFigure`が所有するため、0でも必須内容を保つ正常fallbackは通す。

各図の最終build実chunk URL/hashを同定して**別々に実遮断**し、request発火と対象fallbackをrawに結ぶ。未発火・片方の省略・別図結果の使い回し・同時遮断1回だけでは不合格。意図的URLの遮断と無関係なscript/style/font等の失敗を区別し、global ignoreでnetwork cleanを作らない。noJSの静的説明欠落、chunk失敗時の原文/status欠落などを別負例にする。

printはscene意味と操作非表示を分け、screen用selector可視assertを流用しない。keyboard/modal、focus復帰、全選択、両図の状態独立、実時間play/pause/replay/完了とviewport外停止を確認する。アプリrAFと計測observerを区別し、擬似document.hiddenで代用しない。

標準profileに加え**1920×1080・768×1024、明暗DSF1、Edge/WebKit、全9段階**を追加local受入する（各engine36、計72観測）。実routeのviewport/fullSceneとrawを保存し、独立担当が実画像を確認する。file/hash/engine/profile/stage/`actuallyViewed`をinput digest・BUILD・HTML前後一致へ結び、生成数を視認数にしない。登録14／全191の数は増やさない。

DSF2はnative zoom200%ではない。実200%は別途、確認したbrowser設定・方法・元/結果viewport・検査段階・実視認証拠を残す。DSF/CSS/画像拡大では代用せず、未実施なら未確認とする。通常PCのREADで必須の限定や意味を読めることを優先し、物理端末/スクリーンリーダーも実施せず承認しない。

## 旧検査保護と停止

F1公開後、実受入commit/tree、kit全source/manifest、**全predecessor proofファイルの全内容hash**、旧177の名前/順序/本文と14routesを独立固定する。部分hashやsidecar自己申告だけでは代用しない。新14blockと承認済み追加を除去し、旧assertion/timeoutも維持した前任一致を証明する。欠落/移動/旧本文やproof改変を負例で拒否する。

local/publicは同じcallback/assertionで実行し、最終の**訂正・実日付を含む**input digest、15HTML/BUILD、実画像へ結ぶ。AR-2正式記事/treeレビューとlocal受入、実merge・CI/Pages成功後にartifactを取得し、**全191×Edge/WebKit**、HTTP/MIME/assets、15HTML/BUILDと実際の公開画像を受入する。原失敗rawと限定再試行は別に残す。

性能基準は共通gzip100 KiB/記事固有75 KiB、CLS0.05、入力200ms、rAF p95 32msを保ち、他browser終了後に測る。**現時点は13置換のメモリ上検算と計画整合性のみ**で、実訂正・AR-2・製品試験・実画面・性能・native zoom・公開受入は未実施。最終公開15記事を確認したら、rootが現releaseとportable証拠・別PC再開手順を記録して停止する。
