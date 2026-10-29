# iOS17試行の所有領域内訳を残す候補

2026-10-30。自分用iOSアプリを優先度順に自律実装し、commit・PR・通常main統合へ進める依頼に基づく。実機確認は未完了として進める許可を引き継ぐ。所有範囲はdriver・Node検査と本記録2本・索引・完成計画の6ファイルで、新しい契約・課金・配布やローカルOS導入は含まない。[前の資源観測](../2026-10-29/ios17-resource-threshold-observation.md)を元の準備時点の履歴として保持し、全体の未完了は[完成計画](../../plans/engineering/ios-app-completion.md)で追跡する。

## 5faで確認した最初の違反

作者head `5fa12b10d7a45cb222cfa9395c80d125265491be`に対応する[初回Pilot run 40895516745](https://github.com/pero3dev/ai-agent-library/actions/runs/40895516745/attempts/1)／job `123523412328`では、functionalのmonitorが6.020453秒時点でfree30,912,602,112 byte、owned logical34,405,954,124 byteを記録した。freeは2GiB以上で、ownedが14GiB（15,032,385,536 byte）を超え、違反側は`owned-cap`だった。FS観測例外はfalse、先行stopはnullである。

元のkillでSIGKILLとなり、command exitは6.031556秒、codeとerrorはnull、機能受入はfalse、所有deviceは削除済みだった。保存された全stdout 3,696 byteとstderr 401 byteのprefixにはTest Caseの開始／成功が見えないが、絶対にcaseが動かなかったとは断定しない。期待集合47件の実成功は未受入である。

DMGの記録7,559,529,352 byteとの差は26,846,424,772 byte（25GiB＋2,879,172 byte）だが、同じ時点のDMG照合や個別file内訳はない。stdout末尾がClangStatCacheであることも、singlefile・sparseや物理割当の原因を証明しない。容量上限を増やす根拠として扱わず、まず同じ走査から内訳を保存する。

このrunのdownloadはexit 0、raw5,560,293 byteから既知進捗67,983本／4,615,113 byteを除き945,180 byteを保持した。間引きがあるためcomplete=falseで、rawは旧4MiB超だった。この実行でのbounded retention成功を確認した範囲にとどめ、64MiBが一般に必要・十分と採択しない。取得元・raw／ZIP等のdigestは[機械可読記録](ios17-owned-size-breakdown.json)に残す。

## 同じlstatから保存する範囲

元の再帰reduceを共通関数へ移し、directory自身不算入・symlink0・その他のentryはst.sizeという論理合計と加算順を保つ。regular file以外も旧式どおり数え、hardlinkの新しい重複排除やDerivedData等の除外を行わない。同じlstatで得たStatsからだけ、logical size上位最大8件のkind・raw blocksと安全な相対pathを保持する。追加stat・realpath・du・findや、違反後の再走査を行わない。metadata observerの失敗をnumeric probeへ伝えず、元のFS例外を保つ。

pathはowned root内の完全な相対名だけを扱い、実出力の105 byte名を保持できる160 UTF8 byteを超える名前・不正Unicode・control／backslash・診断のredaction対象は全体をnullとして理由を示す。途中で切った名前を到着先と誤認させない。候補の保持は8件までで、全entry一覧を追加しない。既存のreaddir配列・再帰には新しい深さ／件数制限を設けない。追加のCPU・metadata保持がzero overheadとは主張しない。

元のkill requestを先に行い、最初のmonitor failureに対応するnullable sibling `owned_size_breakdown`をfreezeする。既存`resource_observation`部分は全byte保持し、その2KiB契約を変えない。新しいsiblingも実putと同じnested pretty JSONと改行のUTF8 byte数を確認し、2KiB以下にする。**exit receipt全体の上限が2KiBという意味ではない。** 必要なら最低位の候補から減らし、`omitted_by_budget`へ明示する。

`complete`は走査完了、`selection_complete`は完了した候補から選択できたことを表し、全entryを列挙した保証ではない。logical総量・列挙合計・非列挙残量と、既観測の非列挙entry数を区別する。途中のFS例外ではpartialとして、総量・残量をnullにし、既に見た候補だけを保持する。free-floor短絡・free probe例外・cleanupでownedを読まなければ内訳はnullで、前のhealthy走査を流用しない。最初の構築が利用不能でも、後pollやpost-commandの値で置き換えない。nullは最初の内訳が保持されていないことだけを表し、healthyやresource_failure=falseの証拠にはならない。

既存の1file512KiB・全体2MiB・最終reserve64KiBを守るため、追加内訳が残量に入らなければnullへ落とし、nullable欄も入らなければ新sibling自体を省いて元receiptを渡す。元receiptも上限を超えれば従来putがそのまま失敗する。既存のpost-command FS例外等によりexit receiptへ到達できない場合も変えず、保存を保証しない。

raw blocksはStatsの値またはnullだけとし、Hosted Nodeからnativeの単位への写像は独立確認していない。allocated bytesへの換算・物理容量やsparse原因の推測を生成しない。非atomicな論理サイズである。free2GiB／owned14GiB、時間、download raw64MiB／他command4MiBと保持4MiB、OS・runtime重複拒否・所有・import・postboot回復・47件・cancel／first-stop／resource Boolean・cleanupは維持する。pre-spawn／post-commandの資源判定は観測追加の対象外である。

## 確認と未完了

旧49検査の全文をprefixとして保ち、新21件を加えたNode70件が初回で全成功（exit 0、wall2.327秒、fail／skip／cancel0）、構文2fileもexit 0だった。同じproduction walker／evaluatorとfakeProbe・小さいtempを使い、元のnumeric合計とFS順・一回のlstat／size読取・nested加算順、上位8と同順位・UTF8／巨大名・nested pretty2KiB、各kind／symlink・partial例外・未知blocks、free短絡・first latch・cancel・kill-before-formatと証拠残量fallbackを確認した。既知105 byteのSDKStatCache名をsyntheticな上位項目として完全保持する回帰も含み、実際の原因fileを断定する検査ではない。8領域を逆変換すると作者baseのdriver全byteへ戻る。巨大sparse file・SDK・Simulator・実CIはこの準備で実行していない。

5faの[Runtime26 run 40895516744](https://github.com/pero3dev/ai-agent-library/actions/runs/40895516744/attempts/1)では、既存の2メソッドが一度ずつ開始・成功し、185.479秒／100.373秒だった。15秒の待機条件は不変で、対象waitも成功した。これはA032の以前の待機失敗の原因が直ったことや、新しいSource70での成功を証明しない。PR #301はDraftで、他5系統の完了・最終採用をここでは主張しない。

新Source2の独立レビューはP1／P2なしで受け入れられた。全2,822パスの候補で共通検査は1,242件中1,227成功・15skip・失敗0（npm exit 0、wall53.670秒）だった。固定済みlockfileと準備済み依存を再利用し、Source70は無編集である。以後の記録だけの変更には文書・形式の限定検査を行い、成功済みSource検査やSDKを再実行しない。最終文書・metadataのレビュー、新headの実内訳・原因特定と47件・必要CIは後続である。mainに採用されたFull単体失敗時inventory診断のSourceと記録を全byte保持するが、その失敗経路の実Hosted確認は別の未完了事項である。App0.2.23（25）・TODO32行／完了13行と全rowを保ち、最低OS全体・実機上書き／保存維持・VoiceOver等の未完了を維持する。

## コミットと通常統合の区切り

Sourceの作者baseは5fa／tree `8e1ff43d830e8259a3e70e31db1a6cfcdc9a2805`・2,816パスである。Rootの別のmainSync commitは、通常採用main `ca59520b9a8d616ef0a749101de558afbd412b9a`のFull診断を結合したtree `2293802ee5a4f7b23ea69536f16e78cad1a37e5d`・2,820パスである。Rootは実同期commit `17c00a09ed3f3fbe27e824f85ec9ef82948a4e32`のtree・parents・全tupleを確認したが、未参照でありbranch／PRは5faのままというcheckpointである。本候補はその同期済み索引へ各1段落だけを挿入し、既存4ファイル変更と新記録2本で2,822パスを投影する。作者baseと将来の統合bindingを区別する。

未参照のmainSync commit17cを独立した履歴として保ち、その後Source2と記録を1作業単位の追加commitにする。独立レビュー・共通検査と実際のhead／対象blobを確認した上で、既存[Draft PR #301](https://github.com/pero3dev/ai-agent-library/pull/301)の`codex/ios17-functional-pilot`を通常のfast-forward更新する。新しい正確なheadの7系統と必要な実行証跡、Ready後の最新必須11検査・最終metadata、通常保護によるmain統合と反映後CIをそれぞれ確認する。新Draftへの置き換えや検査迂回を計画せず、旧成功を新headへ流用しない。この準備では共有Source・Git・GitHub・CI・ネットワークを変更していない。
