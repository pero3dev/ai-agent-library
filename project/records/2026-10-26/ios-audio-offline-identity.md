# IOS-04 / IOS-16: offline音声identity契約の候補

## 範囲と基線

実main `750a305a82c6ff7882de46fdf7889c81925c509e` / tree `7636f378ecd8e8202cd2d9c8c9e89e2aa85b875d` から作った私有候補。通常のAgentループ1音声と選定・runtime/player・UI・版・PBXは変えない。AI歴史は現在の原文SHAが一致するmetadata試験fixtureだけに置き、初版採用・追加8本・配信方式・権利許諾は未採択のままとする。IOS-04/16のcheckboxは完了にしない。

## 小さな契約と信頼境界

`createDeclaredAudioResolver`はカタログを読む前にtrusted declarationを検証・コピーし、重複episode ID・記事path/ID・URL、多義的な記事割当を拒否する。宣言はepisode ID・記事ID/path・版付きURL・音声/原文/台本SHA・credit・規約URLの全tupleである。production moduleの宣言は従来Agentループ1本だけで、カタログ自身や同じhostだけから許可を作らない。

native producerは選んだ記事の実textからLF正規化した全文SHAを計算し、記事objectのraw/normalized SHAと宣言の原文SHAへ束縛する。front matterを含みtrimしない。metadataのtuple・part1/1・credit/規約・章/時間の検査後、既存`audioMetadata`へ渡す。出力のshape・順序とsingletonは維持する。

trusted policy注入はJS関数API内部の依存注入・試験だけで、CLIに新引数を加えずselection JSON/catalog/manifest/importから宣言を指定できない。既存の合成unit fixtureには独立したmock declarationを明示する。AI歴史の追加宣言はtest fixtureだけで、production宣言や`ios/content-selection.json`へ入れない。Swift import/replayと`AudioPlayer.allowedAudioURL`の厳密1本許可は変更しない。

## 確認した範囲

- 新targeted Node16件が成功。宣言tupleのURL/ID/各SHA/記事対応/実source変異、credit/規約、part/章、重複・多義性、信頼policyのdata経由注入、初期化と解決のnetwork0を確認した。
- v2で関連Node3suiteを実行し、native-content30・native-audit8・identity16の計54件が成功した。owned temporaryの小さいmock記事/PNG/text packageだけを使い、実published199記事の資産生成・Browser・SDK・音声生成は行っていない。全npm/全CIは実統合時へ残す。
- 既定metadata JSONは旧converterと1773 bytesで同一、SHA-256 `abee691f773ef0ea5830857932229f142fcabfdd4c836ff270351e14cc06838e`。全packageを再生成・比較した結果ではなく、変更のない後段から全bundle同一を実測したとも主張しない。
- 原文監査の3本一致・6本差異を保持し、差異6本は現原文bytesに対してresolverが拒否した。tagsのみの1本も正式な全文SHAの差として拒否し、原文版を新版へ書き換えない。

## 証跡の限界と残件

既存Release metadataは9本ともMP3 asset1つだけで、server digestとcatalog記録値の対応を確認する資料である。MP3をdownload/re-hashした証拠ではなく、台本・READY・制作reviewは未回収。declared script/audio SHAの照合を、それら実bytesの検証や権利判断へ読み替えない。

新SDK/Simulator/Core273 CLI・npm-full・依存install・実published資産/音声生成・download・network・公開・共有source/index/ref変更は0。v2で生成した小fixture PNG/text packageはこの試験のowned temporary内に限る。full CI、必要な制作証拠の回収、採用音声ごとの権利/creditと初版範囲、実iOSの切替/保存/再試行等は別工程である。別人の内容・最終payloadレビューを待つ。

## P2: 既存validator負例の維持

旧v1の負例はaudio対象one.mdを未知headingリンクへ変更していたため、新しいsource SHA guardが先に拒否し、既存link validatorへ届かないと独立レビューで判明した。production policyは変更せず、非audioの第三記事へ未知headingを置き、選択済み概念記事への明示相対リンクにした。期待するUnknown native article or headingと旧出力sentinelのassertは維持し、修正ケースと後続のasset-output負例は成功した。identity負例16件のsourceもv1と同一である。

関連suiteはouter120秒・Node各test60秒・V8 heap384MiB・combined出力512KiB・owned TMPDIR定期観測64MiB上限で実行し、出力5573B、観測したtemporary regular bytes最大45612Bだった。これはfilesystem quota/RSS計測ではない。network/非Node実行deny hookの拒否試行は0、既知の試験process groupは終了しtemporaryもcleanupした。旧freezeを保持し、独立最終レビューを待つ。

## 実main再bindの準備と旧750aの履歴

この入力は明示source commit `f5e6221b7dd01132ff76d36e993b13047b15e24c` / tree `fb717f389c8a94a27c942d59673fb9d762bfd683`。上のbasis・status・監査3/6・Node54件・1773Bの等価性・pending表記は旧750a候補の履歴として保持する。今回のsource6は承認済みbytesに固定し、既存3sourceと単一production向け入力を検査した。1773B/SHAは旧canonical直列化値へのpinであり、追跡Gitファイルや今回の再生成結果ではない。今回のmetadata生成・新CI・SDK・音声bytes検証は0。exact-headの関連試験とdefault値の再照合、別人の最終payloadレビューを残す。

通常Agentループ1音声と追加8音声・権利・IOS-04/16未採択を維持する。P1・Icon・SDK27・Coreと他者の非対象bytes、packageの新aliasやTODOを今回の入力から保ち、旧protected OIDへ戻さない。実mainの鮮度は呼出側が確認し、この私有準備だけで採択・配信・Store受入としない。

## 2026-10-27: 固定snapshotの関連Node検証の追記

上の750a履歴とf5e再bind準備の値・未完了表記は保持し、後続の限定実測を追記する。対象は固定source commit `f5e6221b7dd01132ff76d36e993b13047b15e24c` / tree `fb717f389c8a94a27c942d59673fb9d762bfd683` と承認済みsource6である。最新mainへの束縛や将来headのCIではなく、PR #281の未統合headを実mainとして扱わない。

- identity・native-audit・native-contentの関連Node 3 suiteが、54件成功・失敗0・skip0・cancel0、15.774秒で完了した。source6は変更せず、入力24件の実行前後SHAを照合した。Node v24.19.0、同時実行1、小さいmock PNG/text fixtureの範囲である。
- 通常Agentループ1音声のmetadataを実際に再生成し、旧converterとbyte一致した。JSON直列化値は1773 bytes、SHA-256 `abee691f773ef0ea5830857932229f142fcabfdd4c836ff270351e14cc06838e`。全package・実音声bytesの一致を検証した結果ではない。
- 私有8 MiB envelopeと空き700 MiB下限のguardで実行し、成功試験の観測最大logical bytesは568457、allocated bytesは1142784だった。OS quota・RSS・native bypass全体の保証ではない。既存依存は読み取り専用で利用し、直接依存3件の版・lock integrityを固定mainと照合した。依存再導入は行っていない。

検証要約のSHA-256は `4b0ca97289faabbe255ef38857bb587c67414aacecf73d83d794bbe63b0694e8`、私有証跡manifestは `531f1c314b1a288bcfc851696992d87f32b8347a461f91516725aa22a4611e76`。要約・scopeは同名JSONの `limited_related_Node_validation_20261027` で区別する。初期のread-only open guard・fixture不足等は私有harnessの準備不備として保持され、source6を修正して成功させたものではない。

この限定検証でSDK・Swift compile・Simulator・Browser・network・音声/台本/READYの取得・API/Git変更は行っていない。追加8音声・権利・採択、app player/UI・実機・offline受入は未確認のままである。最新実mainへの再束縛・別人の最終payloadレビュー・新headのCIを残し、将来の実mainは未確定とする。IOS-04 / IOS-16は引き続き未完了である。

## 2026-10-28: 実main142に固定した関連Node検証

旧750a・f5eの履歴と未完了表記を保持し、実main `142041adf3a6ff353555fba78e73f19dd1d977ff` / tree `2ab281bb467db29646f5b1a5b564b6a764d008a5` に固定した後続の検証を追記する。承認済みsource6は変更せず、入力24件の実行前後SHAを照合した。これは将来の音声PRのhead CIや採用結果ではない。

- 第2試行で関連Node 3 suiteの54件が成功し、失敗0・skip0・cancel0、14.799秒、exit 0だった。Node v24.19.0、同時実行1、小さいmock PNG/text fixtureの範囲であり、既存の成功54件を転記したものではない。
- 通常Agentループ1音声のmetadataを新たに生成し、同じ実main142の旧converterと1773 bytesで一致した。SHA-256は `abee691f773ef0ea5830857932229f142fcabfdd4c836ff270351e14cc06838e`。Swiftの許可tupleも静的に一致したが、Swift compile、全packageや実MP3・台本・READYのbyte検証ではない。
- 私有8 MiB envelope、空き700 MiB下限、V8 heap384 MiB、outer120秒・各test60秒・combined出力512 KiBで実行した。観測最大logical bytesは535552、allocated bytesは1011712、guardの拒否件数は0で、既知の試験processの終了とowned TMPDIRの空を確認した。これはOS quota・RSSやnative bypass全体の保証ではない。直接依存3件の版・lock integrityを照合し、依存再導入は行っていない。

第1試行はowned fixtureの削除とcollectorの容量走査が競合し、ENOENTでcollectorが中断した。試験件数・exit・PIDは未確定のまま保持し、54件成功やsource失敗と扱わない。後続の限定read-only process確認では対象argvの残存0件を確認し、owned TMPDIRだけを整理した。第2試行のcollectorはowned TMPDIRの列挙・lstat中のENOENTだけを許容し、開始時のPID/PGID記録と終了待ちを追加した。他の例外は伝播させ、source6を変更して成功させたものではない。既存guardの固定Node子process出力上限は1 MiBから512 KiBへ縮小し、allowlistと書込み制限を維持した。

要約のSHA-256は `9d97d16ed159da40181f65756aaf986ed2b508d539d8afa681284db67f38e021`、証跡manifestは `b4fb181c776da6478f84cb2429242dea8c0e535050557eebc187fce1249936d0`、proofは `fb2afb19c45093ae23e0dc089b9d44bebcfe622291961a4aa1bad354a43e6651`。同名JSONの `limited_main142_related_Node_validation_20261028` で、第1試行の未確定値と第2試行の結果を区別する。

今回もSDK・Simulator・Browser・音声取得/生成・network・API/Git変更・クリップボード操作は行っていない。通常音声は従来の1本を維持し、追加8音声・権利・Store採択、app player/UI・offline・実機受入、IOS-04 / IOS-16は未完了のままである。記録整理とコピー候補の統合後、音声の実統合時点のmainへ再束縛し、別人の最終payloadレビューと新headのCIを行う。
