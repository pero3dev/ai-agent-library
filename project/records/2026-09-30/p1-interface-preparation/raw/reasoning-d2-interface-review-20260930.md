# D2 推論モデル・インターフェース案の独立計画レビュー

判定: **approved / low（must 0、should 0）**。採択済みD2の具体化として妥当です。本文の正式publish-review、製品実装、実画面・ブラウザー・公開受入の承認ではありません。

- reviewer_run_id: `01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_doc_review`
- reviewed_at: `2026-09-29T18:51:37Z`
- 対象MD: `reasoning-d2-interface-proposal-20260930.md`
- MD SHA256: `cad4d2c26839426d4d4ca42027def563c9c33299666ff7b493c505426b1e2732`
- 対象JSON: `reasoning-d2-interface-proposal-20260930.json`
- JSON SHA256: `e9fed4e5450549dd04704fbff3d9ae4148dabdfe52c607d5f0b486e1467ced99`
- 計画・入力照合commit: `ca3c09eebd1b549564f874f3304d23ae25328194`
- レビュー中の観測HEAD: `8382b757c8a2fa3719448e1b180271b1cdd56f99`。元記事は上記commitと同一hashでした。HEADの作業状態や公開版一致を承認した意味ではありません。

## 指摘表

| 対象 | 行・箇所 | must | should | 判定 |
| --- | --- | --- | --- | --- |
| 提案MD | 15–50行: 原文・READ・sequence | 0 | 0 | 問題なし |
| 提案MD | 52–75行: evaluation・操作・比較 | 0 | 0 | 問題なし |
| 提案MD | 77–159行: 所有・非主張・検証・後続境界 | 0 | 0 | 問題なし |
| 提案JSON | adopted.article / inventory / reading / interfaces / independentAssertions | 0 | 0 | 問題なし |

## 独立検算

採択計画MDのD2節、JSONのD2 object、元 reasoning-models.md 全文、提案MD/JSONを読みました。作者selfCheckや作者の実行コードを独立証拠とせず、独自スクリプトで以下を確認しました。製品モデルは存在前のため呼び出していません。

- 採択計画JSON SHA256は `1cef526de4f41aebe195360c50c526386d199f0cd511dc477911223a4a4a7319`。提案 adopted.article は採択D2 objectと全フィールドdeepEqual。state/motion/checks、26動的/17静的論点、sourceHeadings、READと手動段階を保持します。
- 元記事SHA256は `71246ca014e171936139af9083df301f16dcb7dade8f7aeb3a0b14516a19ef44`。提案の原文・現在・候補に一致し、本文訂正は0です。
- unified + remark-parse/frontmatter/gfm/math で元記事を独立解析。位置情報以外の全ASTを正規化し、SHA256 `eb85b1513c5f56e896902a387d505e0ee967ff6d5cbbbd93566846f61202cecc` を再現しました。
- root children43、H3 9、H3配下body18、表2、list11、blockquote1、display/inline math0、code/Mermaid0。全node type別個数と9節のcanonical AST hashも一致しました。元記事に数式がないことを確認し、新しい説明式を追加しません。
- 独自に指定AST index・blockTypes・count・H3の初回同梱・READ段階を照合しました。2図の有効化全4組合せについて、指定範囲を独自包装して復元すると、positionを含む元childrenまで完全一致しました。これは計画の包装範囲の検算で、未実装の製品decorationが成功した証拠ではありません。
- source.inputsの17ファイルは、提案の観測commitから得た生バイトhashとLF正規化hashがそれぞれ一致しました。

| 図 | 段階 | READ | 手動のみ | 原AST範囲 | sourceDigest |
| --- | --- | --- | --- | --- | --- |
| reasoning-sequence | 4 | 0,2,3 | 1 | [12,16) | sha256:497581aab0df110ad41c3fbc116fc1837073be16d937aaaa44e99d4cab8ad107 |
| reasoning-evaluation | 5 | 0,1,2,3,4 | なし | [16,32) | sha256:4b26e91dcb1f6d5d7e09a43f86a1b622cd2c9a5a3b53e8846e234d39ec615930 |

計6H3・14bodyを包装し、静的な3H3・4bodyを残します。原文から段落・表データ行・list itemを独立集計して43原子単位を再現し、26動的はすべてREAD到達段階、17静的には保持理由があります。

## READでの意味網羅

sequence S0は最初の原段落に対応し、既生成の記号から後続予測への条件矢印を見せます。S1は模式的な追記だけで、新しい必須結論を閉じ込めません。未操作のREAD2へ直接到達しても、記号と矢印、学習調整の別枠、推論時の固定重み、思考再現ではないラベルを同時に返す契約です。通常モデルにも中間考察が可能なこと、CoT指示だけでは説明し尽くせないこと、検証の正しさを保証しないこともREAD2に残ります。S3は推論と最終回答の帯を残し、実費や時間比に変換しません。

evaluation S0は既存表の非対称な候補群を保持し、表から自動採否を決めません。S1でモデル別の制御と未計測3指標、S2で追加便益の限界と要件・権限制御の別問題、S3で必須条件と実行側の強制、S4で繰返し測定・可視思考の限界・品質/費用/待ち時間の同時記録を扱います。26論点を原文と対応させて読み、必須結論が未操作READから失われる提案は見つかりませんでした。

## 操作・比較・架空値の境界

操作はevaluationの2 control・5 optionだけです。taskFocusはS0で原表の行を強調し、左右の異なるタスク候補を同一入力として比較しません。別に設けた比較枠は、一つの同じ入力・モデル・指示・基準を固定し、思考量だけを変える模式比較です。モデル比較そのものを禁じる説明にはしていません。

effortFocusはS1/S2で低め/高めの強調だけを変え、両レーンを保持します。非対象段階では有効値をnullとし、選択履歴が別段階の意味や測定値へ漏れない契約です。低め/高めをproviderのAPI enumや固定トークン予算と同一視しません。

4試行枠は同じinputIdを持ち、低め2枠内・高め2枠内のconditionIdは各々一致しました。設定間は思考量だけが違い、全12指標セルは未計測です。A/Bは推奨試行数でも実行済み件数でもありません。数値0への変換、実測を装う性能曲線、追加の便益や課金値は導入していません。本文の「2ポイント/3倍」は原文の説明例にとどめ、図の測定値に転用しない判断は妥当です。

条件付けの矢印はモデルの生成機構を表す模式関係です。そこから実測性能や個別応答の原因を断定しません。非公開思考を生成・推測・再現せず、記号の数と帯の長さもトークン数・時間・費用を意味しません。S3の探索枠は実際の権限判定を実行せず、モデル外の実行コードという境界を明示します。

## 一次資料の限定確認

reviewed_atまでに、[DeepSeek-R1 v1](https://arxiv.org/html/2501.12948v1)の学習による推論能力調整の記述と、[Overthinking論文 v1](https://arxiv.org/html/2412.21187v1)のAbstract・§1–2.2を独立に再確認しました。前者は学習と実行を別枠にする説明、後者は対象モデル・数学問題で追加資源の便益が小さい場合があるという限定に整合します。性能数値・研究の具体的思考文を提案へ移しません。

作者の「今回Web取得なし」は作者の作業範囲として正しく、今回reviewerの確認とは区別します。元記事の2026-09-10アクセス日を更新した扱いにしません。現在のprovider API仕様・価格・可視性を網羅確認した判定でもありません。

## 承認の範囲と後続

本判定は、このhashの提案が採択済みD2を忠実に具体化していることへの承認です。D1公開受入と親担当の開始指示、開始時main/共有API/source/digest再照合は引き続き必要です。D1/D2の制作開始には読み替えません。

モデル・AST装飾の実装後の独立検査、全9段階とREAD持越しの実画面、ブラウザー操作、fallback/print/reduced-motion、kit追加と旧assertion保持、CI/Pages、同版公開受入は後続ゲートです。提案の属性列挙や今回の構造検算だけでこれらを合格としません。P1全15記事の公開受入後に停止し、P2を始めない条件を保持します。

製品・記事・kit・Gitは変更していません。他担当の変更も戻していません。TEMPの本レビューMD/JSONのみ作成しました。
