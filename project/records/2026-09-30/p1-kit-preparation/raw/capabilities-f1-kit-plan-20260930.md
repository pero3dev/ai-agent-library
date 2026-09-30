# F1 能力と限界 — 検証キット計画案

2026-09-30。担当 `/root/pretraining_visual_review`。所有はこのMDと同名JSONのみ。**計画まで**とし、記事・製品・kit・登録・Gitを変更しない。E3正式公開受入、計画の独立レビュー、root開始指示後に実装する。P1全15記事の公開受入で停止し、P2へ進まない。

## 正本とbaseline

正本は `project/records/2026-09-30/p1-interface-preparation/raw/capabilities-f1-interface-proposal-20260930.md/json` の `adopted` / `proposed`、同raw内の `capabilities-f1-interface-review-20260930.md/json`（interfaceのみapproved、must/should 0）、`project/records/2026-09-24/p1-remaining-storyboards.json` のF1と原記事 `docs/10-llm-foundations/capabilities-and-limits.md`。現物hashと参照範囲はJSONの `evidenceInputs` に固定する。

実在runnerは現在 **D2候補121ケース・10 artifact routes**。E3後の **165ケース・13 routesは将来値**であり、受入commit/tree、callback本文、全proof hash等はnullにする。E3正式公開受入後に実物から厳密凍結する。現121や準備計画を未来165の実行証拠と扱わない。

## 追加12ケースの再計数

| 種別 | 件数 | 主な検査 |
| --- | ---: | --- |
| 全段階・画面条件 | 6 | 1440×1000明/暗、1280×720明、390×844明/暗、960×540明DSF2 |
| 意味・selector | 1 | 独立literal、6タスク/4観点、局所可視意味、設定の有効範囲と境界 |
| keyboard / modal | 1 | 全選択、段階制限、focus復帰 |
| READ | 1 | 全5停止点往復、未操作の既定S1 |
| native playback | 1 | 実時間進行・pause・replay・完了 |
| noJS / chunk fallback | 1 | 2contextで別々の契約を確認 |
| print | 1 | scene意味と操作非表示を分ける |

**165+12=177ケース、13+1=14 artifact routes**。新routeは `/docs/llm-foundations/capabilities-and-limits`。将来E3登録直後・既存favicon前へ連続12blockを追加し、取り除けば旧165の名前・順序・callback本文を復元する。正確な位置/本文hashはE3の実物を凍結してから決める。

1engine当たり、全profile整数は6×5=30、既定の境界往復は2方向×3点(.49/.50/.51)×4境界=24。非既定代表としてtaskKind=procedureの0.5/1.5、assessmentFocus=failure-costの3.5を同様に18観測する。有効選択は6@S1+4@S4=10、READは5×往復=10。保持設定のbrowser検査はtask6×全5段階とfocus4×全5段階の50観測（既定同士5cell重複、45unique）に、非既定どうし2組×5段階を加える。**model単体では全24保持設定×5段階=120cell、24設定×24境界観測=576**を別に検査する。browserが全24組合せを走ったとは記録しない。これらは12登録内の観測であり、ケース数や画像枚数ではない。

## 図と独立期待値

1図 `capabilities-assessment`、marker **`CAPABILITIES / ASSESSMENT`**。5段階すべてREAD、手動専用なし。元の台本は「二つの軸」「タスクの条件」「ツールと検証」「条件付きの記録」「見積りの手順」。製品model/fixtureをimportせず、採択仕様と原文から期待値を独立に書く。JSONに固定ID、原表6行の対応、未計測の10フィールド、各段階の可視文言/geometry、18群の負例を置く。

| 操作 | 選択肢 | 有効段階 |
| --- | --- | --- |
| `taskKind`「表のタスク」 | text / code / arithmetic / characters / knowledge / procedure | S1のみ。既定text |
| `assessmentFocus`「見積りの観点」 | precision / verification / cases / failure-cost | S4のみ。既定precision |

値は保持できるが、有効段階以外のeffective値はnull、意味/表示へ影響しない。操作も無効段階では非表示とする案。両方が同時に有効になる段階はない。S4のfocusは強調だけを変え、4手順の表示・順番を変えない。

**S0/S1: 流暢さと正確さ。** 同じ模式出力から別の評価欄へ2本の経路を分け、**各側1個ずつ**未評価の状態を持つ。2個を片側へ集めて総数だけで通さない。モデル・言語・入力・タスク依存と、流暢だから要求を満たすとは限らない留保を残す。出力例・品質点・正解印は作らない。

fresh READ1ではselectorを触る前のtext既定だけで、2評価欄・「傾向は保証ではない」・「独立検証が必要」・タスク→検証経路が見えることを確認する。6選択は原表6行の短ラベルと傾向 **得意/得意/苦手/苦手/苦手/要検証**へ一対一対応する。現在モデルの実測やランキングにはしない。非公開の訓練データ量だけで原因を断定せず、苦手≠不可能、要約/翻訳にも意味の正確性の確認が要る留保を守る。行別の新しい具体例は足さない。

**S2: 外部道具と検証。** 計算・集計→コード実行/電卓、最新・ニッチ知識→検索/RAG、正確な操作・状態変更→APIの**3経路を同時表示**する。モデルの判断と外部の決定的な実行を区別し、「選択・引数・結果の解釈」の3検証点を残す。共有の3検証点でもよく、各経路に3個ずつ複製する要件にはしない。経路と検証点の接続を実geometryで確認し、ツールがあればAgent全体が正しい、あるいは実行が成功したと扱わない。

**S3: 条件付き記録。** 日付・モデル・試し方は未記録のplaceholder。架空の日付や実測結果にしない。公開benchmarkと代表実ケースは別枠で、ハーネス・汚染・飽和の3留保を示す。思考量は品質・latency・costの評価軸であり、性能曲線・最適設定・順位は未知のまま。モデル/条件の変化から再評価へ戻る経路を保つ。

**S4: 判断の手順。** 厳密さ→検証可能性→代表的な面倒な実ケース→失敗コスト/検知/回復の**4手順を全focusで表示**する。原文の **10〜20件は試行の目安**であり、十分な標本数、統計的保証、合格閾値、必須テスト件数ではない。`sampleSufficiency` と `acceptanceDecision` はnull、判断は未実施のまま。自動採用/配備のチェック印や結論へつながない。

局所の可視文字・数・線を同時に検査する。data-IDだけ、hidden title/desc、別欄の同じ語、全ページkeyword一致では通さない。主語/否定の反転や留保の消失も負例で拒否する。水平strokeの高さ0だけで不可視判定せず、始点/終点・描画長・色を確認する。bboxの衝突候補は実画像の字形で判断する。

## 原文とfallback

原ASTを独立解析し、root38、H3 8、内容body14、包装H3 5/body11、35論点=動的23+静的12を確認。原表は**見出し1行+本文6行、3列、21cell**。list10/listItem37/link25、数式・code・Mermaid・blockquoteは0。TODO節は「なし」なのでTODO asideも0。元表の全セル文字行列hashとAST hashで、ラベルだけでなく由来/リンク/順序を保つ。wrapperの有効/無効2通りを原ASTへ復元する製品検査は今後行う。DOMでは図・TOC・静的段階やGlossary装飾を切り分け、生の全anchor件数を原文件数と等置しない。

noJSとchunk失敗は同じ登録case内の別contextで、期待値を分ける。**noJSは原文・h1・原表・5静的説明**。**chunk失敗は原文・h1・原表・読込失敗/本文継続のstatus**を求め、失敗sceneの静的説明数は要求しない。`DiagramBoundary`はstatusと元children、静的リストはscene内`ReadingFigure`が所有する。実buildの対象lazy chunk URL/hashを同定して実遮断し、そのrequest発火と対象fallbackをrawへ結ぶ。遮断未発火は不合格。静的説明0でも必須内容がある正常fallbackは通し、本文/表/h1/status欠落を拒否する。数式のない記事へ数式検査を足さず、意図的遮断以外のcritical resource失敗も隠さない。

printはsceneの意味とcontrol非表示を分ける。keyboard/modalでHome/End/arrows、step/pause/replay/READ復帰、全選択、focus復帰と名前空間IDを確認する。1図なので架空の別図独立検査ではなく、task/focusの有効段階とmodal/本文の状態整合を確認する。nativeは実時間の進行/停止/完了とviewport外での停止を確認し、計測observerとアプリ自身のrAFを区別する。

## 追加ローカル画面受入と証拠

標準6profileに加え、最終静的buildのF1実routeを**1920×1080・768×1024、明暗DSF1、Edge/WebKit**で全5段階確認する。各engine20、両engine40観測。原表・図・本文・操作の重なり/欠け/overflowを検査し、viewport/fullSceneのrawと独立実視認台帳を保存する。file/hash/engine/profile/stage/`actuallyViewed`を前後input digest・BUILD・HTMLへ結ぶ。生成枚数で視認済みにせず、追加12／全177の登録数へ加算しない。

**960×540 DSF2はnative zoom200%ではない。** 実ブラウザーの200%設定と実routeを確認する追加検査・独立実視認を別に残し、元viewport・実方法/設定・結果viewport・確認段階を記録する。DSF/CSS transform/画像拡大では代用しない。未実施は未確認として残す。通常PCのREADで、必須の説明を拡大操作だけに頼らず読めることを優先する。

E3公開後、受入commit/tree、kit全source/manifest、**全predecessor proofの全内容hash**、旧165の名前/順序/本文と13routesを実物から固定する。部分hashやsidecar自己申告だけで代用しない。新12blockと承認済みimport/route追加だけを差し引いて前任一致を証明し、欠落/並替え/旧assertionやtimeout/proof改変を負例で拒否する。

local/publicは同じcallbackとassertを用い、最終localは14入力/HTML/BUILDと実画像へ結ぶ。正式treeレビュー、実merge、CI/Pages成功後にartifactを収集し、**全177×Edge/WebKit**、HTTP/asset/MIME、14HTML/BUILDと公開実画像を受入する。初回失敗rawと限定再試行を別々に保持する。性能は共通gzip100 KiB/記事固有75 KiB、CLS0.05、入力200ms、rAF p95 32msを維持し、他browser終了後に測る。

**製品試験・実画面・native zoom・性能・CI・公開受入は未実施**。残件はE3実物の凍結と、制作後の局所DOM/可視文言/geometryの独立固定。新たな科学的数値・統計保証・自動判断は必要ない。
