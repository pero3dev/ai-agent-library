# E2 文脈内学習と記憶 — 検証キット計画案

2026-09-30。担当 `/root/pretraining_visual_review`。**計画のみ**。所有はこの MD と同名 JSON の2ファイル。製品・記事・kit・登録・Git は変更せず、ブラウザー検査・公開受入も実行しない。終了条件は、採択仕様に沿った固定期待値・追加16ケース・旧検査の保存方法を独立レビュー可能にすること。

E2 実装は E1 と C2 の正式公開受入、計画の独立レビュー、root の開始指示の後。P1 全15記事の公開受入で停止し、P2 は始めない。

## 正本と実在する baseline

採択仕様は `project/records/2026-09-30/p1-interface-preparation/raw/icl-e2-interface-proposal-20260930.json` の `common`、`proposed[0..2]`、`independentAssertions`。読みやすい版は同ディレクトリの `views/icl-e2-interface-proposal-20260930.md`。独立 interface review は `raw/icl-e2-interface-review-20260930.json`（approved、must/should 0）。台本は `project/records/2026-09-24/p1-remaining-storyboards.json` の E2。原記事は `docs/11-llm-internals/in-context-learning-and-memorization.md`。各正本の**実ファイル SHA-256 と参照範囲は同名 JSON の `evidenceInputs`**に固定する。interface 全文・全 fixture は複製しない。

現在の実在 kit は **D2 候補121ケース・10 artifact routes**。`TEMP/context-e1-kit-plan-20260930.json#/currentBaseline` にその先行スナップショットがあり、今回も現行 runner の121宣言を確認する。E1 の135ケース・11 routes はまだ計画値である。**将来の135ケース本文・hash・受入 commit/tree は null とし、E1正式公開受入後に厳密凍結する。** 現在の121を135の実物と扱わない。

## 追加する16ケース

| 種類 | ケース数 | 主な範囲 |
| --- | ---: | --- |
| 全段階・画面条件 | 6 | 1440×1000明/暗、1280×720明、390×844明/暗、960×540明 DSF2 |
| 図ごとの意味 | 3 | literal・可視説明・全境界往復・履歴不要・selector |
| keyboard / modal | 1 | 3図、focus復帰、図別状態、強調切替 |
| READ | 1 | 11停止点往復＋手動段階を飛ばす2経路 |
| native playback | 3 | 各図の実時間進行・pause・replay・完了 |
| noJS / print | 2 | 原文、13静的段階、数式、TODO、印刷の操作非表示 |

E1 後の想定は **135 + 16 = 151ケース、11 + 1 = 12 artifact routes**。新 route は `/docs/llm-internals/in-context-learning-and-memorization`。新登録は将来の `runContextChecks` 直後、既存 favicon ケース前に**連続16 block**として追加する。正確な挿入位置は E1 実物を凍結してから求める。16件を取り除けば旧135件の名前・順序・callback 本文が一致することを証明する。

計数は1 engine当たり、全画面条件の整数段階 `6×(5+3+5)=78`、意味ケース内の既定整数13、境界往復 `2×3×(4+2+4)=60`、有効 selector `2値×2段階=4`、保持値と段階の grid `2×3=6`、READ `2×11=22` と fresh carryover 2。これらは16ケース内の観測数であり、追加ケース数や画像枚数ではない。全selectorと全profileの直積を要求しない。16件の予定名は JSON の `extension.cases` にある。

**追加ローカル受入。** 共通計画の1920px・768px、および採択interfaceの「plus current required large/tablet profiles」は、上記16ケースとは別の必須補助検査で満たす。最終静的buildのE2実routeをEdge/WebKitで開き、**1920×1080・768×1024、明暗、DSF1の各条件で全13段階**を確認する（各engine `2幅×2テーマ×13=52` 段階観測、両engine104）。可視文言・経路・図/本文/操作の重なりと欠け・横overflowを照合し、viewport/fullScene画像を保存する。独立担当が実画像を確認し、段階・engine・profile・画像hash・`actuallyViewed`を台帳に記録する。必須条件の未視認を生成枚数で補わない。結果は同じ候補のinput digest・BUILD・記事HTMLの前後一致へ結び、補助rawと独立視認判定をlocal受入記録から参照する。この検査は未実施であり、追加16／全151の登録ケース数へ加算しない。

**200%拡大の証拠は別に扱う。** `960×540 DSF2` はviewportとdevice scale factorの条件であり、ブラウザーのnative zoom 200%とは呼ばない。200%の受入には実ブラウザーでズーム設定を確認したE2実routeの追加検査と独立視認を保存し、engine・元viewport・実際のズーム方法/設定・実視認範囲を明記する。DSF変更、CSS transform、画像拡大だけでは代用しない。未実施なら200%は未確認のまま残し、成功扱いにしない。

## 図ごとの独立期待値

| 図 / marker | 段階 / READ / manual | 操作 |
| --- | --- | --- |
| `icl-hypotheses` / `ICL / HYPOTHESES` | 5 / 0,1,3,4 / 2 | 独自selectorなし |
| `icl-demonstrations` / `ICL / DEMONSTRATIONS` | 3 / 0,1,2 / なし | `comparisonFocus`: order「順序」/count「例数」。S1/S2のみ |
| `icl-memory-evaluation` / `ICL / MEMORY & EVALUATION` | 5 / 0,2,3,4 / 1 | 独自selectorなし |

期待値は採択仕様と原文から独立に書く。製品model/fixtureのimport、実DOMからの期待値生成はしない。JSONの `figures` は代表literalと各段階の可視要件、`negativeFixtures` は19群の負例を固定する。

**仮説。** 推論中の W と潜在タスク θ を区別する。S1は posterior / conditional の両因子が marginalization へ入る3項・4辺を検査し、勝者仮説を選ばない。S2は内部表現の before→after で、重み最適化ではない。S3は学習則の全経路と、`A B … A → B` の**5出現・3種類の関係**を同時表示する。同じ A/B を1つの出現IDに潰さない。S4は3仮説を相補的・未確定として並べ、外部検索ノードを持たない。**fresh READ0→1→3**だけで S2 の全経路と研究条件の留保が S3 に見えることを検査する。

**例の比較。** baseline `[ex-1,ex-2,ex-3]`、順序 `[ex-3,ex-1,ex-2]`、例数 `[ex-1,ex-2]` を3行同時表示。各行の件数を個別に **3/3/2** と検査し、全体8件だけでは通さない。query・W・形式/ラベル空間の慣例・評価条件は共有し、例の除去後まで経験的入力分布が同一とは表現しない。`comparisonFocus` は強調だけ。S0は selector 非表示・effective null・保持値による表示変化なし、S1/S2は両選択でも3行を残す。原文の限定的なラベル研究を「ラベル不要」「誤ラベル推奨」へ反転させず、性能向上・最適順序/例数を捏造しない。

**記憶と評価。** S0/S3は同じ snapshot の train / heldout を別枝で表し、**各側1個ずつ**の未計測metricを持つ。S1の同じ記号列は2出現を無方向の線で結ぶ。既存矢印部品を流用して検索・因果の矢印にしない。S2は記憶の全対応帯、heldoutとの区別、grokkingの学習時間軸、double descentのモデル規模軸を同時に見せる。概念的な形と留保を照合し、数値目盛・実測sample・普遍的主張は認めない。**fresh READ0→2**でも手動S1の対応帯が成立する。推論の重み固定を訓練期間全体へ広げない。S4の集合は train/benchmark 各2 membership、3 unique ID、交差は `shared-eval-item` 1つ。共有項目は両集合内に存在させる。代替3件「非公開の評価」「新しい評価」「混入を点検」と未知の清浄性を表示し、汚染率・スコア増分や清浄保証は作らない。

## 可視性・原文・操作の検査

- data-IDと同時に**各欄内の可視文字**・関係・数を観測する。hidden title/descや別欄の同じ語では代用しない。θ/W、仮説・研究条件、非普遍性、非保証などの留保が消えたり反転したfixtureを拒否する。
- 行・集合・辺は同一座標系の実geometryを観測する。線の始点/終点やmembershipの包含を照合する。水平SVG線はheight 0でもstrokeと長さがあれば可視であり、長方形の面積判定を流用しない。bbox交差の候補は実画像で字形と照合する。
- 原文は **8 H3 / 18 body、対象5 H3 / 15 body、37論点=22動的+15静的、displayMath1 / inlineMath2 / inlineCode3**。3図の全8 enabled subsetを巻き戻して同一ASTに戻す。原文の式・順序・リンクを重複しない。
- 原文のTODO blockquote 1つは既存装飾で **`aside.todo-callout` 1つ、DOM blockquote 0**になる。TODO本文・リンクを保ち、blockquoteタグを要求して誤検出しない。原文リスト等の計数から `.rf-article-toc,.rf-static-stages` を除く。KaTeXのCSS/fontと式単位のoverflowを確認する。
- keyboard/modal、native進行、READ復帰は通常操作で確認する。force clickやstageの直接改変で通さない。3図の独立状態と名前空間ID、modalのfocus復帰を守る。
- **printは意味検査と操作非表示を分離**する。画面用の「selectorが見える」assertを印刷へ流用しない。noJSは原文と13段階の静的説明を読む条件とする。

## 前任検査の保存と証拠

E1公開受入後、kit全source・manifest・**全predecessor proofファイルの全内容hash**・旧135件の順序付き名前とcallback本文・11 artifact routesを、受入 commit/tree と結んで凍結する。特定区間のhashや書換え許可リストだけで全proof内容の固定を代用しない。新16 blockと承認済み追加import/routeだけを戻した前任本文が一致し、欠落・移動・旧callback改変・proof byte改変を負例で拒否する。

local adapterとpublic runnerは同じ E2 callbackを使う。rootが共有登録/AST安全性/dispatcherを統合し、最終localは12入力digest・12HTML・BUILDの前後一致へ結ぶ。公開は実merge・成功CI・Pagesの後でartifactを収集し、**全151×Edge/WebKit**と実際の公開画像・観測assetを照合する。途中失敗原本と限定再試行を別々に保存し、local結果をpublicへ読み替えない。

独立画像レビューは13全段階と、手動carryover、仮説S3、記憶S2、両強調、集合・無方向線などのリスク箇所を優先する。viewport/fullScene、engine/profile/modalを区別し、`actuallyViewed` 台帳に実際に見た画像だけ記録する。PC標準READで十分読めることを要件とし、生成画像数・全profile機械成功を実視認数と混同しない。

性能は既定上限（共通部gzip100 KiB、記事固有部75 KiB、CLS0.05、入力200 ms、rAF p95 32 ms）を維持し、他のブラウザー試験終了後に測る。負の対照記事で新chunkが読まれず、手動pause/viewport外で不要なrAFが残らないことを確認する。observer自身のrAFはアプリ計数から除く。**この計画では測定、画像受入、物理端末・スクリーンリーダー検証は未実施**。

未確定なのは将来のE1実物と、E2制作後に定まる可視説明の局所locator/geometry取得方法である。採択済みの意味・件数・唯一のselector有効段階に追加の方針判断は必要ない。

2026-09-30追補: 独立計画レビューのshould 1件を受け、large/tabletの証拠経路と200%の区別を明確化した。改訂前は `TEMP/icl-e2-kit-plan-initial-20260930.md/json` にbyte-identicalで保存済み。追加16件の名前・順序・callback計画と全151／12 routesの想定は変更していない。
