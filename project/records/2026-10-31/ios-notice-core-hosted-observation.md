# Notice対応Core観測の固定入口とHosted事前検査案

## 通常main88採用とUI単位への結合準備

Coreコード単位は通常保護のsquashにより、2026-10-31T11:36:41Zに実main `88c9ac391459ead50cf5e28b25918f97ac9332cf` へ採用された。実treeは `42a595f687677ceda2203873f01a0864b06f43f6`、全2850のmode/blobは承認source3bfと一致し、single parent・%B本文/trailers・形式検査0のRoot証拠manifest SHA-256は `f1b9fd58b562b5045bebc4e9512ce24a73149d534465cbd7251b4062963f80bf` である。保存host観測と固定CLI・独立レビューf387の受入は実source `3bfe7e740d38225b89b7428b02991d8e12776638` の結果であり、main88で新しくCoreを測定した結果とは呼ばない。

main88の新push CIは別の結果である。FullA初回はiOS18.5/iPhone16のdestinationが見つからずexit70・テスト未到達、FullB初回は所有Simulatorのpre-UI pbcopyがETIMEDOUTとなりUI0・374B copy成功0だった。Rootはrun41197576925の失敗2jobだけを条件不変で各1回、11:48:55Zに再試行した。成功jobの再実行とsource/caps/assert変更は0で、Native/Commonの進行と合わせて新mainpush全成功は未受入である。

この追補は実base88のCoreとUI PR #320の追加を保つ結合準備で、後続の提出parent/commitはまだ発行していない。UIのstride修正は別の未受入コード単位であり、Core5 source・App版・PBX・固定19raw/15sample・予算不採択を保持する。Docsのpublication parentとcurrenthead CI/mainはTODO(採用待ち)。TODO32行/14完了とIOS-15全体の未完了を変えない。

## 実main採用前に準備したhost受入追補（履歴）

## 実source3bfのhost観測と保存結果の受入

実source `3bfe7e740d38225b89b7428b02991d8e12776638`（tree `42a595f687677ceda2203873f01a0864b06f43f6`）のHosted macOS Core観測と、保存結果に対する固定production検証CLI・独立データレビューを受け入れた。これは同sourceの保存済みhost CLI観測の受入であり、PR #318全体のCI終了・通常mainへの採用はまだ確認していない。コード・App0.2.28（30）・PBXは変更せず、この追補は記録・索引4パスだけの未公開案である。実main SHAとDocs提出基底は **TODO(採用待ち)** とする。

[公式artifact（run 41193300627／artifact 13039308590）](https://github.com/pero3dev/ai-agent-library/actions/runs/41193300627/artifacts/13039308590)はZIP 27,759,919B、SHA-256 `0a7e9ef1eb264be305ff639a65e583da2654dbdebe9bc58702627a7736d19b76`。保持1264ファイル・43,955,728Bをreceiptへ照合した独立レビューはP1/P2とも0で、review.jsonのSHA-256は `f387cccf8015eb18420a9e1b7604d399d007b9cae937237d2a026d8f393e103d` である。観測48ファイルには実binary 539,768B、identity、summary、compiler stderrと全19 raw stdout/stderrが含まれる。Rootはartifact内コードを使わず、別途信頼した固定入口c911・engine1588・runner4276で検証CLIを実行し、exit0／0.752084167秒、stdout SHA-256 `d8a5004950adbf1266c759db73e371e42e4476735c3b556554e90d4167491a08` のaccepted-host-observationを確認した。artifact内のコード・binaryはこの再検証と独立レビューでは実行していない。

検証対象はartifact自身のprepared/Content全626ファイル・40,079,063B、listed625、PNG422、公開199記事である。既存local Content626・37,744,644Bとはrendered bytesが異なるため混用していない。identity、Core4・query16・harness・runner、immutable published docs199、corpusと全raw/summaryの一致を確認した。保存rawはcorrectness1回・破棄warmup3回・記録15回、3scenario各5回で、PIDとUUIDも保存値の19 uniqueを照合した。独立レビューは中央値・最小最大・範囲を再計算して一致を確認した。

| scenario | elapsed中央値（秒） | 各fresh processのpeak RSS中央値（B） |
| --- | --- | --- |
| validation | 1.055999375 | 79,233,024 |
| index-construction | 0.147352125 | 19,480,576 |
| indexed-filter | 0.333788292 | 19,496,960 |

実GitはApple Git-154、selected Xcode16.4だった。source11行はlocal9＋固定vendor2、bare6行はlocal4＋vendor2、config.worktreeの83B条件はinertとして通った。run内before/afterの全構造は一致し、prepareとのselection/rowsも一致した。stageごとに異なるTMPDIRを同一環境値とは呼ばない。570probe対、547partial objects、204required blobsと2850のtree leafを保存データから照合したが、完全clone・全filesystem不存在やkernel実行真正性の証明ではない。

outerは45.587486666秒、sample最小空き45,837,250,560B・最大専有81,104,896B・最大owned tree RSS487,473,152Bで、既存180秒／開始3.8GB・継続3.2GB／専有256MiB／RSS1.5GiB／出力8MiBの条件を満たした保存票を確認した。sampleでありhard peakや全process隔離ではない。cleanupも保存された既知groupの範囲である。過去b79との数値優劣、p95、性能予算、App起動・入力・scroll・iOS/実機・VoiceOverの受入へ拡張せず、TODO32行／14完了とIOS-15全体の未完了を維持する。

再現は、別途信頼した同sourceの入口・engine・runnerを持つ `<repo>` と、検証済みartifactの展開先 `<artifact>` を指定して行う。これは保存データの読取検証で、compileやbenchmarkを再実行しない。

```sh
node "<repo>/ios/tests/verify-core-performance-notice-20261031.mjs" \
  --observation "<artifact>/ios-core-notice-20261031/run/observation" \
  --corpus "<artifact>/ios-core-notice-20261031/prepared/Content" \
  --revision 3bfe7e740d38225b89b7428b02991d8e12776638
```

次はPR #318の実currenthead全必須検査と通常mainをRootが確認し、実main SHA/tree・Docs4の提出parentを結び直して独立レビュー・必要な文書検査を行う。これらは **TODO(採用待ち)** であり、この私有追補自体の公開・commit・main反映は未実施である。

## 先行Source9の候補準備と失敗履歴

最新候補: 通常main `7c1ec1d7319eade2209d8a28fbcdf94661759d7c`（tree `f5ee9c7f5fb54fc4059fc347b27a98b2db50c443`）を基底とする提出parent `fb392378467c4ed238eba0a6495b149b29247e07` からの追加候補である。基底2843から所有9パス・新規7件によりtarget2850を維持する。workflow・固定入口2・索引2・App0.2.28（30）・PBX・Source4・runner・engine・query・計測protocolと、Git子のPATH/TMPDIR環境は保持する。

D402の保存診断は、先頭2行がunknown scope・Xcode vendor分類で、既知preset名がcredential.helper=osxkeychainとinit.defaultbranch=main、その後9行がlocal/own-main configであることを示した。1347Bの診断SHA-256は `a04d5f2404409d3f0270cccc7723b7e1a15aac34e02796cbdffb34879fcb153e`、最初の拒否は行0で、完全分類でも全条件の受入を意味しない。実raw origin・Git版・vendor config全bytesは未保管であり、Coreのobject凍結・compile・19raw/15sample測定は開始していない。D402のNode22事前4工程とHosted pure26件の成功は当時のsourceだけの実績として保持し、新候補へ転用しない。

Apple公開Gitには独立したXcode設定層があり、scope名のswitchにそのcaseがないためunknownと表示される実装がある。今回採択した互換範囲は、既存3つのselection probeをauditより前に1回行い、実際に選択された標準の数値版Xcode prefixにcanonicalなexec-path・backend・既存selectorのpresent/resolvedが一致することを要求するもの。そのprefixのusr/share/git-core/gitconfigというexact origin、literal unknown scope、上記2key/valueが各1件の集合だけを認める。任意vendor/globalを許可せず、CLT・別prefix・selector無し/不一致・別origin・重複・未知presetを拒否する。Swift用Xcode16.4固定とGitのdefault選択は別であり、実Gitの版やpathがこの条件に適合するかは新headで初めて確認する。

source/bareへ同じselectionを明示して渡し、既存local origin/key/value・空のcanonical extensions条件・include/filter/hooks・replace/alternates/promisor等の拒否を保持する。vendor2件とlocalを分け、bareは従来のlocal4件にvendor2件を必須とする。sourceのlocal件数は既存基準を維持し、観測9件を別の成功値として補わない。producer前後の全rows・raw bytes/hash・backend/selectorの一致を維持し、receiptのscopeもowned-localと固定selected-Xcode-presetの合成であることを表す。probe数・上限は増やさず、設定ファイル・環境・ユーザー権限を変更しない。

固定Git argvはversion/exec-path/config-list/cat-file、runnerはrev-parse/show/ls-treeで、credentialやtransport操作を要求しない。Apple公開builtin/config.cのlistは値を出力し、credential.cではhelper設定保存とget/store/eraseのdispatchが分かれていることを一次コードで確認した。この限定の静的根拠を全Git経路や実exec不存在の証明にはしない。fixtureは26case名・件数を維持し、guard SHAと既存2caseの呼び出し順・selection引数期待だけを同期した。新候補のfixture実行・共通検査・独立レビュー・新head CI・Core測定・保存成果物の独立replay・通常mainは未受入である。TODO32行/14完了、IOS-15・予算・実機の未完了を維持する。

## D402までの提出候補（履歴）

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

## main88新pushの完了とPR320の一覧読取追補（作成時点の記録）

実main88の新pushは、保存した2026-10-31T12:26:37Zの公式観測で、Common9・追加deploy・Nativeが成功した。Commonはrun41197576965、docs1214件中1198成功・16skip・失敗0、build97件全成功・browser677件・Firefox14件成功である。Nativeはrun41197577014で278 executed・2skip・失敗0、UI7件・Releaseが成功した。278全件が成功したという数え方にはしない。

published候補run41197576925の初回Aはdestination不在でunit未到達・UI0、初回Bはpre-UI pbcopyのETIMEDOUTでUI0・copy未確認だった。上の失敗記録を保持したまま、Rootが失敗2jobだけを条件不変で各1回再実行したattempt2を別結果として受け入れた。A2 job124529151938はUI18件、B2 job124529152023はUI8件が失敗0。両ログの実passed case IDをsource由来の期待集合へ照合し、重複なし・互いにdisjoint・和集合が元の全26件と完全一致した。B2では実UI destinationの正確な374B copyと独立Releaseも成功した。観測packet manifest SHA-256は `08c27f1e557a0ce84838d2d58798eda6c4381378216a78324ecfecf3533b6260` である。

この新pushには別のCore host／R26測定／Recovery matrix／SDK workflowは発火していない。source3bfの保存19raw・15sample、Rootの固定production CLIと独立データレビューf387は、その測定sourceへ結び付いた既存の受入履歴として保つ。main88との全2850 tuple一致は採用の証拠であり、新mainでCore CLI19/15を再実行した結果へ置き換えない。性能予算・cold起動・実機とIOS-15全体は未完了である。

PR #320の現parent `9eca95f3fe571291999803424e724bd733583db2` では、文字サイズと回転の一覧読取がUI前に止まったため、専用workflow2とpure helper・unitの4入力へ限定した補修を準備する。4つの固定一覧読取だけで、ETIMEDOUT・SIGKILL・exit nullがそろった場合に1回だけ読取を再実行し、初回とretryを別receiptへ残す。受入れた成功readのsource/read/args/name/rawSHAとreceiptを所有検証へ結び付け、初回rawも保持する。既存run、30秒の各読取、90/180秒のstage、step/job上限、source・JSON/version/UUID判定・cleanupを保つ。作成・起動・build・UIのretryや判定の緩和は加えない。

新しい読取補修のrevision2は固定Source4へ結び付いたRoot検査でpure fixture24件成功・skip/fail0、0.4915975秒だった。actual production関数にfake files/clock/spawnを渡した範囲で、実xcrun・driver・Simulator・SDKの成功ではない。2YAMLは重複key拒否を含むparse、抽出driver2はNode構文exit0で、両job43分を確認した。Source4 manifest SHA-256は `76264915d989182cf70e087c62a2f53c5c76e3f0f34ec88f561d17638c2613ad`、Root検査manifestは `4dd9d3e48c3756def3a27bb0696a61736c7160522cf9082b8ea61e62532ced1d`。新共通検査・全12入力の最終レビュー・新head Hostedと通常mainは未受入である。既存Reader1bb/UI6とAppf4の同bytes型検査だけを履歴として引き継ぎ、新一覧読取の実効果・stride/font伝播/default復帰の成功にはしない。TODO32行／14完了、IOS-11・15・25と実機等の未完了を維持する。
