# iOS17 CompilationCacheを含む次回の論理容量予算

2026-10-30。自分用iOSアプリを優先度順に自律実装し、commit・PR・通常main統合へ進める依頼に基づく。所有範囲はdriver・Node検査と本記録2本・索引・完成計画の6ファイルで、実機確認は未完了として進める許可を引き継ぐ。新しい契約・課金・配布やローカルOS導入は含めない。[前の内訳収集](ios17-owned-size-breakdown.md)は当時の準備・予算の履歴として保持し、全体の未完了は[完成計画](../../plans/engineering/ios-app-completion.md)で追跡する。

Rootは独立診断の提案を確認し、次回試行用の**総owned logical上限を14GiBから39GiBへ変更する**と採択した。従来14GiBの許容量に今回観測した25GiBのlogical reservationを加える算定で、物理quotaや独立した「非cache14GiB枠」を実装するものではない。

## 実8aで分かった内訳

head `8a2c9c2701469484a3842fe61faec3dd59ecda39`の[初回Pilot run 40908548283](https://github.com/pero3dev/ai-agent-library/actions/runs/40908548283/attempts/1)／job `123569886096`では、同じmonitor走査の14.053594秒時点でfree31,598,936,064 byte、owned logical34,425,496,060 byteを記録した。freeは2GiB以上、ownedは当時の14GiBを超え、最初の理由は`owned-cap`だった。

| 項目 | logical byte | raw blocks |
| --- | ---: | ---: |
| CompilationCacheのv8.data | 17,179,869,184 | 0 |
| CompilationCacheのv8.index | 8,589,934,592 | 0 |
| CompilationCacheのv3.actions | 1,073,741,824 | 0 |
| 3本合計 | 26,843,545,600（25GiB） | — |
| その他のlogical合計 | 7,581,950,460 | 未集計 |

3本は`DerivedData/CompilationCache.noindex/generic/v1.1/`内の項目である。same-walk・complete・non-atomicの390 entryから、nested pretty1,828 byteのtop7を保持し、収録予算で候補1件を省略していた。top7を全390件の一覧や総physical使用量へ読み替えない。stdout末尾のSDKStatCacheを大きいfileの原因とする根拠ではない。取得元・digestは[機械可読記録](ios17-compilation-cache-budget.json)に残す。

functionalはSIGKILL、exit14.0764755秒、codeとerrorはnull、機能47件は未受入、所有deviceは削除済みだった。保存された全stdout 3,696 byte／stderr 401 byteのprefixにTest Case開始・成功は見えないが、絶対に未実行だったとは断定しない。開始時の共有残量445,439.512292ms（約7.42分）は保持し、今回の理由で時間を増やさない。以前のpostboot一覧は初回deadlineの後、許された唯一のfresh readが成功しており、今回の終端原因ではなかった。

downloadはexit 0、raw5,865,991 byteから進捗73,131本／4,964,532 byteを除き901,459 byteを保持した。間引きがあるためcomplete=falseである。このrunでの進捗収集成功を、64MiBの一般的な必要性・十分性や機能検査の成功へ広げない。

## 39GiBの扱い

新上限は39GiB＝41,875,931,136 byteで、実8aのlogical標本は収まる。変更は`PILOT.ownedBytes`の定数1個だけで、pre-spawn・monitor・post-commandは同じfieldを参照する。cacheの検出・除外や別枠の計算を追加せず、全DerivedDataを数える元のlogical metric、directory自身不算入・symlink0・その他st.sizeと加算順を保つ。owned上限も不変だったとは主張しない。

raw blocks0はその時点の3fileのmetadataであり、総physical容量や将来割当の保証ではない。logicalサイズを変えずに後から割当が増える可能性があり、この総上限はdenseな追加writeもより多く許し得る。free2GiBは独立したbest-effort観測のままで、poll間burst・同時write・FS raceを防ぐphysical quotaではない。39GiBが次回や将来に十分であることも未確認である。

Xcode16.4でcache無効化flagがこの予約を止める効果は未検証のため追加しない。allocated metricへの変更やcache／DerivedData除外も混ぜない。free2GiB、work19分・download10分等の時間、download raw64MiB／他4MiB・保持4MiB、証拠1file512KiB／全2MiB／reserve64KiB、OS・runtime重複拒否・所有・import・限定postboot回復・47判定・cancel／first-stop／cleanupは保持する。

## 確認した範囲

定数1個を逆変換すると8aのdriver全byteへ一致する。旧70検査の全文prefixは保持していない。70件目の105 byte path回帰は固定標本34,405,954,124 byteでmonitor停止を前提としていたため、新方針に合わせRootがsetupだけの限定補正を承認した。production ownedSizeProbeのread→snapshotへ替え、105 byte名の完全保持・合計・一度のlstat等、全assertionと検査identityを保った。旧69全文prefixを保持し、このfixtureの逆変換と追加3件・区切り1LFの除去で旧70全byteに戻る。

新3件はproduction evaluator／monitorを通し、実8a標本が収まること、39GiBの等号境界を許可し＋1 byteで停止すること、独立2GiB free floorがownedを短絡することを確認した。全73件が初回成功（exit 0、wall2.274秒、fail／skip／cancel0）、構文2fileもexit 0だった。成功したNodeを補助inverseのLF訂正のために再実行していない。巨大file・実SDK・Simulator・新CIはこの準備では実行していない。

8aの[Runtime26 run 40908548292](https://github.com/pero3dev/ai-agent-library/actions/runs/40908548292/attempts/1)では、既存の復帰／3記事メソッドが各1開始・1成功、99.629秒／166.975秒だった。Sourceや15秒・fullyVisibleのpredicateは不変であり、A032の以前の失敗原因の修正や新Source73での成功を証明しない。

Rootの8a checkpointはPilot失敗、Runtime26／SDK26成功、CommonはSafari jobのAPI取消・steps空により失敗、残る3系統はpending、既知必須11は10成功・1取消だった。取消理由は不明で、Safariテストが失敗したとも扱わない。これは凍結する旧headの部分履歴で、採用の十分条件ではない。新headでは7系統・実47件・Runtime26既存2件とReady後の最新必須11を改めて確認する。

## コミットと通常統合

作者baseは実8a／tree `4dd770f54c2801a0718552fb5b5ead038b90a86e`・2,822パスで、mainca595の採用済みFull診断と既存Native復旧を含む。本候補はSource2の無編集copyと記録・索引の既存4変更／新記録2本で2,824パスを投影する。追加mainSyncは不要で、対象blobと実際のheadはRootが提出前に再照合する。

Source予算と記録を1作業単位のcommitとし、独立Sourceレビュー・共通検査・最終6ファイルレビュー後、既存[Draft PR #301](https://github.com/pero3dev/ai-agent-library/pull/301)の`codex/ios17-functional-pilot`を通常FFで更新する。新epochの7系統・必要証跡・実47件・Runtime26既存2件、Ready最新11・最終metadata、通常保護main統合とafter-pushを別々に確認する。旧head再実行、新Draft置き換え、admin例外は計画しない。PR全体のタイトル・本文はRootが最終差分へ合わせる。

Source2の独立レビューはP1／P2なしで受け入れられた。全2,824パスの候補で共通検査は1,245件中1,230成功・15skip・失敗0（npm exit 0、wall41.867秒）だった。固定済みlockfileと準備済み依存を再利用し、Source73は無編集である。後続の記録のみの差分には文書・形式の限定検査を行い、成功済みSource検査やSDKを再実行しない。最終文書・metadataのレビューと新head実計測・CI・通常統合は後続である。App0.2.23（25）、TODO32行／完了13行と全row・既存記録を保持する。実機上書き／保存維持・VoiceOver・最低OS全体・Full診断失敗経路等は未完了のままで、この容量試行から受入へ広げない。共有Source・Git・GitHub・network・SDK・CI操作は行っていない。
