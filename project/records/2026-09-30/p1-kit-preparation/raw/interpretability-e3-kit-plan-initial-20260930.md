# E3 解釈可能性 — 検証キット計画案

2026-09-30。担当 `/root/pretraining_visual_review`。**計画のみ**。所有はこのMDと同名JSONの2ファイル。記事・製品・kit・登録・Gitを変更せず、ブラウザーや公開受入は実行しない。E2正式公開受入、計画の独立レビュー、root開始指示後に実装する。P1全15記事の公開受入で停止し、P2は始めない。

## 正本とbaseline

仕様は `project/records/2026-09-30/p1-interface-preparation/raw/interpretability-e3-interface-proposal-20260930.md/json` の `adopted` と `proposed.figures`、独立承認は同じraw内の `interpretability-e3-interface-review-20260930.md/json`（approved、must/should 0）。台本は `project/records/2026-09-24/p1-remaining-storyboards.json` のE3、原文は `docs/11-llm-internals/interpretability-basics.md`。同名JSONの `evidenceInputs` が現物hashと参照範囲を固定する。interface全文は複製しない。

実在するrunnerは **D2候補121ケース・10 artifact routes**。E2後の **151ケース・12 routesは将来値**であり、受入commit/tree、callback本文、全proof hashはnull。E2正式公開受入後、その実物から凍結する。現在121やE2計画を、151件の実在する検査証拠と扱わない。

## 追加14ケース

| 種別 | 件数 | 検査範囲 |
| --- | ---: | --- |
| 全段階・画面条件 | 6 | 1440×1000明/暗、1280×720明、390×844明/暗、960×540明DSF2 |
| 各図の意味 | 2 | 独立literal、局所可視文言/geometry、全境界、介入の有効範囲 |
| keyboard / modal | 1 | 両図、介入2値、状態独立、focus復帰 |
| READ | 1 | 全9停止点往復、最初の対応READで意味が揃うこと |
| native playback | 2 | 各図の実時間進行・pause・replay・完了 |
| noJS / chunk fallback | 1 | 2contextで原文・数式・9静的段階を確認 |
| print | 1 | 可視意味と操作非表示を別々に検査 |

**151+14=165ケース、12+1=13 artifact routes**を予定。新routeは `/docs/llm-internals/interpretability-basics`。将来のE2登録直後・既存favicon前に連続14 blockを追加し、取り除けば旧151の名前・順序・本文が一致する。挿入位置と前任本文のhashはE2の実物ができてから決める。

1engineの観測数は全profile整数 `6×(5+4)=54`、意味ケースの既定整数9、既定中点往復 `2方向×3点(.49/.50/.51)×(4+3)=42`。介入replaceの有効境界2.5/3.5をさらに往復12観測する。selectorはS3の2値、保持値×全5段階の10cell、READは9×往復=18。これらは14ケース内の観測数で、追加ケースや画像枚数ではない。手動専用段階は0。

## 独立literalと可視要件

| 図 / marker | 段階とREAD | 独自操作 |
| --- | --- | --- |
| `interpretability-evidence` / `INTERPRETABILITY / EVIDENCE` | 5段階・READ0〜4 | S3のみ `intervention`: ablate「部品を止める」/replace「部品を差し替える」 |
| `interpretability-sae` / `INTERPRETABILITY / SAE` | 4段階・READ0〜3 | なし |

期待値は採択仕様と原文から独立に書き、製品model/fixtureをimportしない。JSONの `figures` に固定ID・stage名・null対象・局所件数・geometry、`negativeFixtures` に18群の負例を置く。実DOMを読み取って同じ値を期待値にする検査は認めない。

**観察と介入。** S0は行動観察と内部機構の二つの範囲を同時に示し、相互補完と単独では決定的でない留保を保つ。S1は `representation-h` から独立訓練した `probe-independent` への枝と本体出力経路を分ける。「取り出せる」と「因果的に使っている」は異なり、プローブ→本体出力の矢印や未実施の成功率は描かない。S2は注意への批判と定義/モデル全体の検証を重視する反論の**2欄を同時に**見せる。重み配列・重要度得点や同出力の実験結果を発明しない。

S3は同一 `input-x` の通常/介入**2レーン**。各側に入力・対象状態・出力状態が1つずつあることを局所に数え、結果は未計測・比較待ちのままにする。部品停止/差替えは対象部品だけへ作用する。保持値を持っていてもS0/1/2/4はeffective nullで意味・表示へ影響しない（操作も非表示とする案）。原文READ3にある **A B … A と誘導ヘッドの候補**をS3から見せる。S4も候補の続きBを保持し、時期の観察的一致と因果証明、残差ストリームの文脈、対象機構と全モデルの証明を区別する。fresh READ0→3で候補が揃うことも検査する。

**SAE。** S0は一つの次元が複数の記号的特徴と関わる模式図で、具体的な発見特徴名や普遍的な一対一対応を作らない。S1は玩具モデル由来の重ね合わせ仮説と、同じ原リストにある**SAE分解研究への流れを既に表示**する。fresh READ0→1で確認する。図中の方向/slot数を実モデルの次元数・特徴数へ読み替えない。

S2は `activation-x`、記号係数、方向、`reconstruction-xhat`、`residual-r` を原式へ対応させる。係数は非負・大半0、非零項だけを再構成へ結び、**≈と未解決の残差**を局所に表示する。0 slotからの寄与線、等号・完全逆変換・誤差0の主張を拒否する。明示slotの大半が0であることと実際の寄与線を照合し、省略記号をslot件数へ加えない。具体的なslot数は制作時のレイアウトとして独立fixtureへ固定し、科学的な疎性率にはしない。S3は再構成を保ちつつ「網羅性・評価・規模」の3課題、ラボ自己報告、安全保証未確立をREADに残す。

data属性だけでは通さず、**それぞれの欄の可視文言**と関係を照合する。hidden title/desc、別の欄にある同じ語、全ページkeyword一致で代用しない。矢印の始点/終点・レーン・残差・境界を同じ座標系で観測する。水平線のbbox高0だけで不可視にしない。bbox衝突候補は実画像の字形で判断する。記号の表記差は元式の変数・添字・演算子を保つ範囲で正規化する。

## 原文・共通動作の保持

原ASTを独立解析し、**root50、内容H3 9／全H3 10、内容body21、包装H3 5／body16、論点41=動的20+静的21**を確認した。全論点には定点観測TODO1を含む。表示数式1、inlineMath3、inlineCode6、list12、listItem47、link25。原数式valueと全ASTのhashは採択レビューに一致。製品wrapperは今後全4有効化組合せで原ASTへ戻ることを検査する。

原文のblockquoteは3つ。最初の最終確認日・自己報告の引用は通常blockquote1つとして残り、末尾TODO2つは **`aside.todo-callout` 2つ**へ装飾される。原ASTとDOMの数を混同しない。`変わりやすい項目(定点観測)`を含む全10 H3と元の本文/リンクを保持する。原文の計数から `.rf-article-toc,.rf-static-stages` を除く。原KaTeXを一度だけ表示し、CSS/fontと式単位のoverflowを確認する。

link/strongなどの数は原ASTの期待値である。DOMでは追加GlossaryリンクやTODO見出しなど既存装飾を切り分け、元のリンク先・本文を照合する。生の全anchor/strong件数をAST件数と等置しない。

keyboard/modalは通常操作・focus復帰・名前空間ID・図別状態を検査する。nativeは実時間で進み、pause/viewport外で不要なアプリrAFが止まることを確認する（計測observer自身のrAFは除外）。noJSとE3 chunkだけを遮断するfallbackは別contextとし、意図的な遮断URL以外のcritical resource失敗を無視しない。printはsceneの意味と操作非表示を分け、画面用のselector可視assertを流用しない。

## 追加ローカル画面受入

14登録ケースとは別に、最終静的buildのE3実routeを**1920×1080・768×1024、明暗DSF1、Edge/WebKit**で全9段階確認する。各engine `2幅×2テーマ×9=36`、両engine72観測。可視意味、図・本文・操作の重なり/欠け/overflowを検査し、viewport/fullScene画像とrawを保存する。独立担当が必須条件の実画像を確認し、engine/profile/stage/画像hash/`actuallyViewed`台帳をinput digest・BUILD・HTML前後一致と結ぶ。生成数だけでは視認済みにしない。この補助検査は追加14／全165に加算しない。

`960×540 DSF2` はnative zoom 200%ではない。200%は別途、実ブラウザーの設定を確認した実route検査と独立視認を保存し、engine・元viewport・実際のzoom方法/設定・結果viewport・検証段階を記録する。DSF変更・CSS transform・画像拡大では代用しない。未実施なら200%は未確認と明示する。

標準PCのREADで全文を拡大操作に頼らず読めることを優先し、両論、介入2値、S3候補、SAE早期研究経路、疎性/≈/残差/安全境界を実画像で重点確認する。明暗・狭幅・低PC画面・DSF2・modal・追加2幅の実視認を区別する。物理端末やスクリーンリーダーは実施しない限り承認しない。

## 旧検査と公開証拠

E2受入後にkit全source、manifest、**全predecessor proofファイルの全内容hash**、旧151の名前/順序/callback本文と12routesを実受入commit/treeへ結んで凍結する。部分hashやsidecar自己申告だけで代用しない。追加14blockと承認済みE3 import/route追加だけを戻し、前任本文の厳密一致を確認する。旧callback/timeout/assertion改変、欠落/移動、proof内容改変を負例で拒否する。

local/publicは同じcallbackとassertを使い、独立レビューの最終入力と13HTML/BUILDへ結ぶ。正式treeレビュー、実merge、CI/Pages成功後にartifactを収集し、**全165×Edge/WebKit**、HTTP/asset/MIME・公開HTMLと実画像を照合する。初回失敗rawと限定再試行を別に残し、local証拠をpublicへ読み替えない。

性能基準は共通gzip100 KiB・記事固有75 KiB、CLS0.05、入力200ms、rAF p95 32msを維持する。他のbrowser実行終了後に測定し、無関係記事へのchunk漏れとidle loopを確認する。**製品検査・性能測定・実画像・native zoom・CI・公開受入はすべて未実施**。残る具体化はE2実物の凍結と、制作後の局所locator/文言・模式slot数の固定であり、新しい科学的主張や数値例は必要ない。
