# P1 検証キット準備の引き継ぎ原本

2026-09-30のE1〜F2計画と独立判定を、原byteのまま保存する。全5案とE1追補の計画判定を結び付けた固定記録である。 **計画承認のみで、製品実装・実画像・local runtime・公開受入は未実施である。**

[相対索引と全SHA-256](index.json)には元/保存hash・byte数・roundtrip・review.targetsの厳密一致・参照元を記録する。[採択インターフェース](../p1-interface-preparation/README.md)と[全体計画](../../../plans/engineering/dynamic-diagrams.md)も併読する。元JSON内のproposal statusは制作時のまま保持し、計画の最終判定は下表の独立reviewで読む。

## 計画と開始条件

| 単位 | 計画原本 | 最終判定 | 新case / 将来総case / 将来routes | 開始前提 |
| --- | --- | --- | --- | --- |
| E1 文脈・KV cache | [MD](raw/context-e1-kit-plan-20260930.md) / [JSON](raw/context-e1-kit-plan-20260930.json) | [独立判定](raw/context-e1-kit-plan-review-20260930.json)・approved PLAN ONLY | 14 / 135 / 11 | D2正式公開受入後 |
| E2 文脈内学習・記憶 | [MD](raw/icl-e2-kit-plan-20260930.md) / [JSON](raw/icl-e2-kit-plan-20260930.json) | [独立判定](raw/icl-e2-kit-plan-review-20260930.json)・approved PLAN ONLY | 16 / 151 / 12 | E1（およびC2）正式公開受入後 |
| E3 解釈可能性 | [MD](raw/interpretability-e3-kit-plan-20260930.md) / [JSON](raw/interpretability-e3-kit-plan-20260930.json) | [独立判定](raw/interpretability-e3-kit-plan-review-20260930.json)・approved PLAN ONLY | 14 / 165 / 13 | E2正式公開受入後 |
| F1 能力と限界 | [MD](raw/capabilities-f1-kit-plan-20260930.md) / [JSON](raw/capabilities-f1-kit-plan-20260930.json) | [独立判定](raw/capabilities-f1-kit-plan-review-20260930.json)・approved PLAN ONLY | 12 / 177 / 14 | E3正式公開受入後 |
| F2 マルチモーダル | [MD](raw/multimodal-f2-kit-plan-20260930.md) / [JSON](raw/multimodal-f2-kit-plan-20260930.json) | [独立判定](raw/multimodal-f2-kit-plan-review-20260930.json)・approved PLAN ONLY | 14 / 191 / 15 | F1正式公開受入後 |

将来の135/151/165/177/191と11/12/13/14/15 routesは計画値である。原本の実観測121/10はD2候補の履歴で、将来の既定値ではない。各前提の正式公開受入後に、実merge/tree・全kit・順序付きcallback名/本文・全predecessor proofの内容hashを凍結する。索引のacceptedPredecessorはそれまでnullのままとする。rootの開始指示も必要であり、このアーカイブを根拠に未指示の実装を始めない。P1全15記事の正式公開受入で停止し、P2は開始しない。

## 保存した旧版と判定

E2の[初版MD](raw/icl-e2-kit-plan-initial-20260930.md)・[初版JSON](raw/icl-e2-kit-plan-initial-20260930.json)と[初回should1](raw/icl-e2-kit-plan-review-initial-20260930.json)を保持した。1920/768の実route検査とnative zoomの区別を追記した最終版に、限定再レビューを結び付ける。

E3の[初版MD](raw/interpretability-e3-kit-plan-initial-20260930.md)・[初版JSON](raw/interpretability-e3-kit-plan-initial-20260930.json)と[初回changes-requested / must1](raw/interpretability-e3-kit-plan-review-initial-20260930.json)も保持した。noJSの9静的説明と各実chunk失敗時の本文・式・h1・statusを区別した修正版に、M1解消の判定を結び付ける。旧判定を成功へ書き換えていない。

## E1追補の境界

元の承認済みE1は6 profilesのみを明記し、1920/768の追加local証拠経路に記載の空白がある。元計画を上書きせず[表示・読み込み失敗追補](raw/context-e1-kit-plan-addendum-20260930.md)として保存した。現時点は **追補も計画承認済み、実装・実測は未実施**。[追補の独立判定](raw/context-e1-kit-plan-addendum-review-20260930.json)

追補案は1920×1080/768×1024、明暗、DSF1、Edge/WebKit、全11段階で44観測/engine・88観測/両engineを要求し、実画像台帳へ結び付ける。native browser zoom 200%はDSF2や画像拡大と別の証拠とする。既存noJS callback内で2図の実lazy chunkをfresh contextで個別遮断する案も含み、新14/全135の数は変えない。追補の採択前に実装時判断へ任せて完了扱いにしない。

## F2の訂正準備と原本

[判定前のF2計画MD](raw/f2-initial-candidate/multimodal-f2-kit-plan-20260930.md)と[JSON](raw/f2-initial-candidate/multimodal-f2-kit-plan-20260930.json)は最初に受領した候補byteを保存する。最終計画・独立判定は上表から参照する。

[13置換precheck](raw/source/multimodal-f2-correction-precheck-20260930.json)、[rootの一次資料取得メモ](raw/source/multimodal-f2-primary-recheck-20260930.md)、[読み取り補助コード原本](raw/source/check-f2-correction-slots.mjs)も保存した。これは[調査正本](../../../../research/internals/p1-remaining-diagram-sources-2026-09-24.json)の代替ではない。1記事内13置換の未適用確認であり、実改訂日・最終本文/input/tree digest・正式AR-2記事判定は保留である。両図の有効化前に実訂正と通常記事変更manifest・最終treeの独立記事レビューを要する。

## 別PCでの読み方と検証範囲

raw内の絶対パス・TEMP参照・過去のコマンドは履歴であり、このPC固有パスを別PCで実行しない。索引のstored・resolvedStored・archiveSourceはこのディレクトリ基準、repositorySourceはリポジトリ内正本への相対参照である。参照先と過去hashが変わった場合は再凍結時に差分を確認する。原本は編集せず、移動した参照は索引で結ぶ。

すべてidentity encodingの原byteコピーで、変換表示やgzipは不要だった。JSONとレビュー対象hash、コピーの読み戻し一致、Markdown lint、相対リンクを別々に検査する。この保存作業で製品・記事・kit・登録・Gitは変更せず、ブラウザー・native zoom・性能・公開検査を実行していない。
