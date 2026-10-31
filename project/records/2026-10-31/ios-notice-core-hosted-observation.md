# Notice対応Core観測の固定入口とHosted事前検査案

最新候補: 公開済みhead `c1ad6ac58614669f7d0d6e552807fc5b10fbe1b2` への6番目の追加commit候補である。実parent `84f8f3ea1e1a4d3e2c809130af6a0388b7f24564` からの所有9パス・新規7件・target2850を維持し、workflow・固定入口2・索引2・App0.2.28（30）・PBX・Source4・query・計測protocolは保持する。

c1adのprepareは条件付きsurface検査から既存Git設定probeへ進んだが、元のlocal scopeとfile originの条件で `Nonowned system/global/config origin rejected` となった。既存probeはexit0、stdout712B、保存receiptのSHA-256は `b06b45337c9f63b723103a828457eac6d00fe4b9570e3c6f5deb18dd0faf6afe` で、raw stdoutは保管していない。実際のscope・origin・key・value・runner Git版は未特定であり、system/globalのどれかや特定のcredential/LFS設定が原因と断定しない。完全な設定受入・object凍結・Core19raw/15sampleの測定には到達していない。以前のa5eの83B snapshotをc1adの実内容として転用しない。

次候補は既存のprobe・validator・順序・caps・信頼範囲を維持する。既存のrow検証が例外になったときだけ、同じrawを8192B以下・32行以下で分類し、固定scope/origin/key分類、値の型と長さ、既知公開preset名、safe.directoryがown repoと一致するかのboolだけを4KiB以下のexclusive JSONへ保存する。originは字句比較だけで、新しいresolve・stat・read・Git probeは追加しない。未知path・key名・値・値hash・rawは出力しない。上限や形式の問題は不完全と明示し、診断の解析・保存失敗でも元の例外をbare raiseで再送出する。成功側には診断I/Oを追加しない。

この変更は拒否原因を観測するための診断であり、policyの許可範囲や有効設定条件は緩めない。fixtureはguard SHAだけを同期し、26case本文・集合と既存の条件付き互換処理を保持する。新候補の独立レビュー・検証・新head CI・Core測定・独立replay・通常mainは未受入であり、TODO32行/14完了、IOS-15・予算・実機の未完了を維持する。

## 先行c1adまでの提出候補（履歴）

最新候補: 公開済みhead `a5e483bb73e257501b81bbf79ebea484a845b2c5` への5番目の追加commit候補である。実parent `84f8f3ea1e1a4d3e2c809130af6a0388b7f24564` からの所有9パス・新規7件・target2850を維持し、workflow・固定入口2・索引2・App0.2.28（30）・PBX・固定Source4は変更しない。

a5eではactionlintが成功した。保存artifactの診断は、元のpredicateで最初に拒否された対象が `config.worktree`、後段snapshotが通常ファイル83B・nonempty、他5パスがabsentだったことを示した。診断は内容・hashを読んでいないため、実際のファイル内容や拡張設定の有効状態、runnerのGit版は未確認である。Node22事前工程と旧guardのHosted26件は成功したが、prepareは同じ拒否で停止し、Core19raw/15sampleの測定は開始していない。

次候補はsource checkoutだけで、このファイルがsymlinkでない通常ファイル・nlink1・4096B以下というmetadata条件を満たす場合に限り、条件付き互換性を検査する。main configのliteralな空の `[extensions]` 節だけを検査用文字列から除外し、その区間のentry（falseを含む）・非canonical表記・subsectionは拒否する。元ファイルは変更せず、残部の既存raw banと、同じlocal scope・元のconfig origin・既知key/valueだけを認めるGit native監査がすべて通った後だけ、metadataへinert_condition=trueを付けて返す。config.worktreeの内容・hashは読まない。bare側、他5パス、symlink・hardlink・大きいファイル・active/unknown extension・foreign scope・unknown keyは引き続きobjectアクセス前に拒否する。

診断のfieldは `diagnostic_does_not_override_rejection` へ改め、以前のfieldと拒否方針は履歴に残す。この条件付き方針は今回の採択範囲であり、任意の残存ファイルの安全性や一般的な設定許可を証明するものではない。新候補のfixture実行・共通検査・新head CI・Core測定・独立replay・通常mainは未受入である。TODO32行/14完了、IOS-15・予算・実機の未完了を維持する。

## 先行a5eまでの提出候補（履歴）

最新候補: 実parent `84f8f3ea1e1a4d3e2c809130af6a0388b7f24564` へのSource9を維持し、公開済みhead `75f8d51cedff8e1b830dc0ecc2a2866bafe0c999` に追加する差分である。App0.2.28（30）・PBX・固定Source4・索引2は保持する。新規7件・所有9パスでtarget2850、TODO32行/14完了は変えない。

公開75fではactionlintがSC2155の3箇所で失敗した。Node22（v22.23.4）の構文/schema等4工程とHostedの26件は成功し、同runのContent生成・監査工程も成功した。26件は旧guardのpure fake検査であり、Core測定ではない。prepareは `ValueError: Git replacement/alternate/worktree surface rejected` で測定開始前に停止した。保存16ファイルにprobe catalogはなく、6パス中の実拒否対象は未特定である。

次候補は3つの代入とexportを分け、Gitの元の拒否predicateが成立した場合だけ、6固定パスをdirfdとno-followで調べたmetadataを4KiB以下のexclusive JSONへ保存する。設定内容・symlink先・raw例外・絶対pathは出力せず、元の拒否と信頼範囲を維持する。first_rejected_relは元のpredicate時点、metadataは後段の非atomic snapshotとして分ける。fixtureはguard SHAのpinだけを更新し、既存26case本文・集合は保持する。この診断候補の独立レビュー・新head共通検査・Node22/Hosted26・Core19raw/15sample・独立replay・通常mainは未受入である。予算・実機・IOS-15も未完了のまま。

## 先行提出候補の記録（履歴）

現状態: 先行PR316と回転UI単位を通常mainへ統合後の実parent `84f8f3ea1e1a4d3e2c809130af6a0388b7f24564`（tree `3404498d89b9fd771babc3ff97215f22728892ec`）への提出候補である。App0.2.28（30）とPBXをそのまま引き継ぎ、この単位では版を変更しない。Source5と記録・索引4の9所有パス、新規7件によりparent2843からtarget2850へ投影する。Source2独立IR `f31c04d38b90716f38bec693344d15a465efa897eb4b7fa8a12b334cc47fac16`、Source3独立静的IR `aeb8f46ad061703465f3d773ec42163ef14e0f002a6417702124af73be033c39`、初期Rootdocs4の未結合レビュー `b0047d1e7cadd96ec8d37641946ed48ff90a9bc3e8b5f4dfefcaa37069428695`を確認した。

Source3の26件はRootがローカルでpure検証し、26 unique／成功26・失敗0、0.24869275秒、stdout SHA-256 `13e5c37a2b4b07cf285f121af05a108ba133aa3922c3b20f2b24038ad585e043`を保存した。対象はAST抽出関数とfake OS/process/clockの検査で、実children・Git・Swift/SDK・Node・network・Hostedは0である。Hostedでの26fake・Node22構文/schema・Core19raw/15sampleの実行は引き続き未確認である。旧Node境界8件0.267297秒の結果は限定範囲のまま保持する。新headの共通検査・actionlint・最終9レビュー・最初のsecretless Hosted検査とCore19raw/15sample・保存成果物の独立replayは未受入である。artifact取得は後続の実bytes確認であり、consoleだけでoffline replayしたとは扱わない。性能予算・実機・IOS-15は未完了、TODO32行/14完了を維持する。

初回の共通検査は1214件中1199成功・14skip・1失敗、39.544310709秒、exit 1だった。失敗は `tests/unit/harness-tooling.test.mjs` のlockfile監査の先行step検査で、監査とinstallを同じstepに置いていたためである。workflowの既存準備6分を、監査2分とinstall4分の連続stepへ分割した。監査・installの各コマンド、job上限35分、他の工程・guard・26fake・固定入口は保持した。初回失敗の保存ログSHA-256は `932c49b34f31a589febdea10267eab880dbe4d5fb9f0a57c7a6a244769c54235` である。既存Source3静的IRは分割前の履歴として保持し、このworkflow差分の独立レビューと修正後の共通検査・Hosted実行は未受入である。

## 初期未結合案の履歴

以下は実parent未確定で作成した初期案の全文restであり、当時の予定・未確認を現時点の結果へ読み替えない。

2026-10-31作成の未採用案である。先行PR316と回転UI単位の通常mainを待ち、実parentへの結合、最終レビュー、新headの共通検査・CI・通常mainは後続とする。actual parentは未確定で、App版とPBXを変更しない。IOS-15と[完了計画](../../plans/engineering/ios-app-completion.md)の32行／14完了を維持する。

提出予定は5つのsourceと記録・索引4の計9パス。固定Notice verifier entrypointとboundary testの2本に、Hosted workflow・outer guard・pure fixtureの3本を加える。既存CLI/runner/harness/query/engine、旧BYTE contractとquery sourceは変更せず、Noticeを含む現在のSource4・16 query・公開199記事のdigestを新入口のliteralへ固定する。候補identity、CLI、環境、保存ファイルからpolicyやrunnerを選ばせない。revisionの真正性を追加するものではなく、Rootが実source40とtrusted bytesを別に結び付ける。

固定入口の旧Node境界検査は8 unique／8成功、skip/fail0、0.267297秒、15入力保持を確認した。matching Notice identityも次の不正manifest digestで停止させた境界試験であり、実corpusや19 processの受入ではない。Source2独立静的レビューとrev2 guardの限定静的レビューを持つが、追加Source3の独立レビューと実行は未完了である。旧pilot、旧CLI raw、別SourceのCore値を現在のSource4へ転用しない。

Hosted案はmacos-15/Xcode16.4、contents read・pinned actions・credentials不保持、manualまたは同repo公開PRのexact head checkout、attempt1に限る。新規3実行面と固定入口2の5pathを入口にする。manualはworkflowがdefault branchで利用可能になってからとし、初採用前のdispatchを前提にしない。依存準備後、Content生成・freeze・Coreの前にfixture工程を置く。API/secret、pull_request_target、追加retryを加えない。

fixture工程は独立30秒、出力合計1MiB、専有32MiB、空き700MiBのsample条件、step1分。HostedのNode22 version・workflow schema・固定入口/test構文確認と、Python AST抽出26件を別結果として保存する。26は旧18fake＋実catalog関数にfake OSを渡す8件で、実OSのFD・kill・Git・Swiftを検査したとは扱わない。現在は26件・Node22構文・YAMLとも未実施である。default成功gateに加え、prepare/runも同じhead・入力SHA・26 unique成功・Node4子process・全10 rawの票を要求し、失敗ならCoreを起動しない。通常の新head actionlint/共通検査も残す。

Core観測の上限は180秒、開始空き3.8GB／継続3.2GB、専有256MiB、sample tree RSS1.5GiB、出力8MiBを保つ。localの容量条件未達で起動しなかったことは成功や実テストskip件数へ読み替えず、条件を下げるfallbackを加えない。fixture時間はCore180秒の外側にある別枠である。時間・容量・RSSは協調的sampleで、hard peakや全filesystem隔離ではない。

GitはPATH/TMPDIRだけの旧runner子環境と同じ値でeffective configを検査し、raw commit/alltree/必要blobをhash確認して新owned partial storeへ凍結する。replace/promisor/alternates/active hook等を拒否し、producer前後にもconfig・backend・既知selectorを再照合する。freshでquiescentなHosted vendor/defaultへの限定信頼をRootは採択した。親や無関係blobは意図的に欠け、完全clone/fsck、全設定ファイル不存在、実exec/kernel trace、SDK全resource closureの証明ではない。

full Content626、固定source/harness/query、compiler stderr、実binary/identity/summary、生成された全19 raw stdout/stderrとCSVがあれば保持する。artifactで除くのはCore module cache/private process tempだけで、fixture rawも保持する。旧CLIのcompile失敗では完全compiler stderrが出ない場合があるため、不足を失敗として残す。空の成功票を補わない。

最初のHosted prepare/compile、19 raw／15 sample、固定verifierの完全replay、保存結果の独立受入は全て未確認である。macOS host観測が成功しても、App起動・スクロール・iOS／実機・Release、cold cache、性能予算の採択、IOS-15全体の完了とは別に扱う。
