# D1 公開検査キット追加計画（作者案）

作成: 2026-09-29T17:56:39.604Z。所有はこのMDと同名JSONのTEMP2ファイルだけ。製品・記事・kit・Git変更なし。C2の公開受入と実装担当の割当後に着手する。計画の作者確認であり、独立承認・実装・公開受入ではない。

## 固定した基準

現行HEAD ca3c09eebd1b549564f874f3304d23ae25328194。実コードは8記事・91ケースで、旧名列SHA256は afcdab45db9d16af442aaeb284add5d6e952724e912e6f2b8eb6b46255550972。C2 PR61/main CI36606841286は親からの引継ぎ情報で、この調査では外部状態を確認しない。対象はD1 alignment-theoryを9記事目に加えること。P1全15記事の公開受入で停止し、15/199とP0部分2を混同しない。

承認済みP1残7計画のD1と、新interface proposalのadopted3レコードは完全一致した。新exports/hooks/操作/固定値は別のinterfaceレビューでapproved / low、must0・should0（2026-09-29T17:51:55Z、alignment-d1-interface-review-20260930.json）。対象MD/JSONのhash一致を確認した。このkit計画や記事訂正・製品・公開の承認へは読み替えない。A1-A3本文訂正は記事担当がレビューし、適用後のsourceDigestを確定する。元9H3・4数式・Mermaid、6H3/23body包装、42論点（動的27/静的15）を維持する。

## 新16ケース、合計107

alignment-checks.mjsは3図（preference7、reward-risk3、feedback5）、15 READ/手動専用0。画面6（1440明暗、1280x720明、390明暗、960x540明DSF2）で全15段階を確認しviewport/全sceneを保存する。各図semantic+全selector+12境界の.49/.5/.51往復、keyboard/modal、15 READ/独立状態、3図実時間再生、noJS、printで16ケース。case名全列と旧91名はJSONに固定した。

runnerではrunPretrainingChecksの直後・favicon直前へ追加する。旧91の相対順は維持し、90名はそのまま、対照1名のみ下記の通り明示移行する。逆renameで旧91名列を完全復元し、さらに既存71/58名比較にも同じ限定正規化を適用する。順序確認だけで検査本文保護を代替しない。

## 無図対照の明示移行

旧 alignment-theory control: zero heavy figure or shared-frame chunks を同じ相対位置の embeddings control: zero heavy figure or shared-frame chunks へ移す。controlPathは /docs/implementation/embeddings、H1は「埋め込み(embeddings)の選定と運用」。HTTP200/MIME/BUILD_ID、reading-figure0、rf-article-toc0、全scene/shared-frame heavy chunks0、ネットワークassertを維持する。旧名のまま別記事を検査しない。旧90件目（index89）はD1新16名を除いた列での位置を指し、新名1回・旧名0回・同じ位置を検査する。

embeddingsはP1対象外。親の静的調査では未登録・ローカルreading0だが、runtime/networkは未確認。実装時に再確認し、heavy chunkが出たら失敗を解決する。対照はBUILD_ID照合のみで9article artifact集合へ含めない。alignmentは独立artifact HTML hash必須へ昇格する。既存math.specの390明暗DPO式のregion/focus-visible/左右端/分数高さ/ページoverflowは維持し、新画面ケースでも同等の原式可読性を確認する。

## 独立fixtureと主検査

製品model・scene・公開DOM・localbuildから期待値を生成しない。proposalの固定分数/閉形式を別のassert実装で照合する。S2報酬ln3/0から3/4、S5以降はpolicy0.5/0.125とreference0.25/0.25から比2/0.5。beta0.5/1/2のDPO確率2/3,4/5,16/17、1ペア損失ln(3/2),ln(5/4),ln(17/16)。未丸め1e-12と見える約3桁を分離する。参照分布は固定、同じxのZ項2つだけが相殺する。原文L_DPOの期待値と1ペア損失を区別する。残り質量を一つにまとめてfull KLを捏造しない。

reward-riskは同一出力→代理/別評価、冗長と体裁、KLと再評価の両方、保証なしを検査。feedbackは出所と粒度を直交、final1と中間3の評価位置、過程への人手ラベル、S4人手/AIだけの変更を検査する。data属性だけで成功にせず可視ラベル・関係線・数値・画像と対応させる。未知の品質/目的値/安全率は未知のまま。

## 変更対象と保護

runnerはfixed import/3markers/module呼出/9routes/107件/対照だけを追加変更。extractorとcollectorはalignment route追加とexact9へ同期する。regular unique HTML、単一BUILD_ID、artifact API/containerとtar hashの区別、正しいrepo/workflow/event/main/SHA/run/attempt/job/deployment/status/artifactの取得前後一致を保持する。source-mappingにd1Revisionを追加し、既存歴史欄は履歴のまま残す。

foundations/inference/training/pretraining各checks、known-site-observations、portable-pathsは生バイト不変。既存primary assertion、禁止favicon404例外、MIME/body/console/JS無効限定分類、portable出力境界/lockfile/browser/channel契約を緩めない。

## flat predecessor proofとhash循環回避

新d1-predecessor-proof.jsonは旧C2 manifest hash、旧91名とhash、旧filehash、固定3入口のbefore/after、対照移行の意味だけを持つ。旧manifest本文・自己hash・現manifest hashを持たせない。旧c2-predecessor-proof.jsonは不変（SHA256 a464b808ad76f33ec36df3a3e305b3847aeb056c32b58a5cfb62aa5e4ef77cea）。旧helper部分もexact prefixとして保ち、SHA256 e5ddfa8a35d527918654b683b59deb964380fd446d6da2564d3656bf665c2f39を照合する。

current inventory照合→restoreC2ReleaseBodiesでD1逆適用し旧C2全文一致→既存restoreC1ReleaseBodies→既存B/C1/capture protected検査の順。proofに任意path/evalを許さない。最終source/tests→旧だけを参照するproof→そのhashを含むcurrent inventoryの順で固定し、相互参照を作らない。既存C2 unitはraw D1でなく復元C2を入力し、従来の改変拒否テストを残す。

## 実装後の確認と未実施範囲

構文/help/登録名のみ列挙、独立fixture負例、exact9 synthetic tar（欠落・重複・リンク・混合build）、未宣言assert変更/旧名並替/二重rename/proof改変を拒否するunit、root checkを行う。独立レビュー後、同一exportのlocalhost別adapterで予行し、公開専用入口へ偽SHA/artifactを与えない。D1 main CI/Pages成功後にartifact9取得、公開107全件、公開画像の独立レビュー、旧8を含む9記事の入力版受入を揃える。

この計画作成では登録callback本文・ブラウザー・build・ネットワーク・Git書込みを実行していない。kit実装は未着手。詳細file別変更、旧91名/新16名/予定107名、固定値、入力hashは同名JSONを参照。

限定したコード調査を別agentが実施し、現行C2→C1のメモリ内復元と旧91名列・hashを照合した。これは本kit計画全体の独立承認ではない。
