# 読書記録の破損と明示復旧の候補

2026-10-27。基準は `f5e6221b7dd01132ff76d36e993b13047b15e24c`。私有候補を準備した段階で、統合・実SDK・Hosted・画面受入は未完了である。機械可読の範囲と検証は[同名JSON](ios-reading-state-recovery.json)に残す。

## 目的と所有範囲

[IOS-22](../../plans/engineering/ios-app-completion.md)のうち、破損した読書記録を黙って空集合へ置き換え、次の閲覧操作で原データを失う経路を防ぐ。[ReadingStore](../../../ios/AILibrary/Sources/ReadingStore.swift)、[LibraryStore](../../../ios/AILibrary/Sources/LibraryStore.swift)、[一覧画面](../../../ios/AILibrary/Sources/LibraryView.swift)、[既存XCTest](../../../ios/AILibraryTests/LibraryCoreTests.swift)だけを実装対象とする。他者の編集を戻さず、固定mainを基準に準備した。ユーザー承認済みのiOS TODO自律実施の内側で、原データ保全と利用者による明示復旧を扱う。外部操作は0件である。

## 変更と保全

しおり配列・記事別位置・位置内の旧フィールドを独立に読み、正常な要素と他記事の記録を残す。破損を検知したら元の保存keyを変更せず、一覧で案内する。今回の操作はメモリに残り、明示復旧を選ぶまで永続化されないことを表示する。

復旧操作は、元Dataが変わっていないこと、固定の同namespace退避keyが空であること、退避後に同processのUserDefaults読み戻し一致を確認する。diskへの永続化や電源断の耐障害性を保証する検査ではない。退避を確認してから、読めた記録と今回の操作を保存する。退避直後に元keyを再確認し、既存退避・退避失敗・元データ変更時は上書きせず案内する。復旧状態の保存確認に失敗した場合も原Dataの退避を残す。退避は1keyで既存値を上書きせず、自動削除もしない。

読み込み前のData上限は1MiBで、超過または非Dataは解析・退避コピーせず原keyを保護して案内する。正常な旧JSON、既存anchor、通常の保存方法、専用テストsuiteの分離は保つ。新しいネットワーク・署名・配信・権利・クラウドの動作は追加しない。

## 検証と残件

最終候補のSwift 4ファイルに `swiftc -frontend -parse` を実行して成功した。これは構文解析であり、型検査・SDK build・XCTest実行ではない。既存テスト本文を削除・変更せず12件を追加し、混在要素、部分field、今回の操作、明示復旧、固定退避、書込/readback失敗、復旧中の元key変更、入力上限、名前空間、正常旧JSON、Storeの通知を検査する候補とした。optional anchorの将来版・不正値は従来どおり独立にfallbackし、正常なlegacy記録の保存を止めない。anchorモデルと通常の読書操作は変更していない。

この私有作業では依存導入・コンテンツ生成・大きな出力・新module cache・SDK build/test・ネット/API・Git変更を行っていない。Rootによる独立最終レビューとHostedでの実SDK compile／実XCTestが必要である。確認の取消、案内、復旧後再起動の画面受入と、実機・VoiceOverは未実施。実機確認はユーザー指定によりスキップし、成功とは扱わない。記事改名・削除等の移行とIOS-22全体は未完了で、TODOの完了数は変更しない。

## 採択候補の入口同期と版番号

2026-10-27、同じ基準mainに対する別の採択候補として、計画・iOS手順・実施記録索引へ短い案内を追加した。実装4ファイルは独立レビュー済みの凍結候補から変更せず、この記録の上記内容と初回検証事実も保持した。アプリのDebug／Release両設定で `MARKETING_VERSION` を0.2.19から0.2.20へ、`CURRENT_PROJECT_VERSION` を21から22へ更新する。他のPBX設定、署名、UI、コンテンツ、TODOの32行と完了12件は変更しない。

追加同期の検証は既存依存のMarkdownlintによる入口3文書と本記録、JSON解析、版番号だけのPBX差分、既存文と凍結候補の保持照合に限定する。結果は同名JSONの採択候補節に残す。新SDK・実XCTest・UI・実機確認、Swift構文解析の再実行、ネット/API、Git変更は行っていない。新しいmainへの統合とHosted実行は未実施で、そのSHA・runは未確定である。IOS-22全体は未完了を維持する。

## Hosted結果と失敗時診断の追記

2026-10-27の追記準備時点。上記は初回の私有候補と入口同期を準備した時点の記録であり、その字句とJSONの既存値を歴史として保持する。以下は後続のHosted観測と、失敗時診断の追加候補を分けて記す。この追記で固定するmainは `7784228eb167e5909909437ff9d8a779ceb7fa68`／tree `779480ca0111484af87dbc4dabcf7009854216af`、[PR282](https://github.com/pero3dev/ai-agent-library/pull/282)はhead `218dbf05abb1e6f59ceecc67b64701b358c19733`／tree `edddc9298c9e24ef1e46933ecd0a0647671bf0af`のDraftで未mergeである。新しい診断候補のhead・run・将来のmain採用は未確定である。

初期head `91b1ed803c20410919e15d562abae9fa2b189ec5`では、Common・Native・Full・SDK26・Runtime26の5runが成功した。[Native run40476517545](https://github.com/pero3dev/ai-agent-library/actions/runs/40476517545)は165件実行・skip2・失敗0で、追加12件は各開始とpassを確認した。通常UIも2件・失敗0だった。これは91の実結果であり、後続headの成功へ流用しない。

main778を2親で同期した218では、次の新runを個別に観測した。

| 系統 | 218のrun | 実結果の範囲 |
| --- | --- | --- |
| Common | [40481567129](https://github.com/pero3dev/ai-agent-library/actions/runs/40481567129) | 成功。deployはskip |
| Native | [40481567185](https://github.com/pero3dev/ai-agent-library/actions/runs/40481567185) | 165件実行・skip2・失敗0、追加12件各pass、通常UI2件・失敗0 |
| Full | [40481567137](https://github.com/pero3dev/ai-agent-library/actions/runs/40481567137) | workflowとunit・機能UI・Releaseの各step成功。rawケース集計は未取得 |
| SDK26 | [40481567094](https://github.com/pero3dev/ai-agent-library/actions/runs/40481567094) | 成功 |
| Runtime26 | [40481567160](https://github.com/pero3dev/ai-agent-library/actions/runs/40481567160) | 成功 |
| 欠損と復旧のDedicated | [40481567201](https://github.com/pero3dev/ai-agent-library/actions/runs/40481567201/job/122112889903) | Fはraw1件pass、Rはraw1件fail |

218のNativeが実際にcheckoutしたのは合成commit `6996204334d802f802f86283a4a596d4eb6ab940`で、treeは218と一致した。通常5runと最新の必須11checkは成功したが、全workflow成功ではない。DedicatedのR失敗は残っている。Fullの32,555,081B artifactは通常の圧縮16MiB上限を超えるため取得しておらず、過去headの22件等を218のraw件数として割り当てない。最終観測票SHA-256は `c773f626afc7271e2f5c9c8c66d03578a02a010b1d50c1bdeafebbd9ca827f1b`、Native実行票は `0980578b113ba6e17c17221674fd2a618debc7baf3a58a128ac5829dc3e5cc44`である。

DedicatedのRは `NativeReaderUITests.testThreeArticlesHaveNativeBodyText` の最初の一覧件数待機で失敗した。固定218の `NativeReaderUITests.swift:344`、待機45秒、case全体61.591秒、xcodebuild終了65で、process timeoutではない。既存のUI診断は前面状態（rawValue 4）で、検索欄・読み込みエラー見出し・再試行・ファイル一覧不一致の理由が存在し、読み込み表示とnative readerは存在しなかった。本文への到達は確認できていない。

同じDedicatedでは7回のinstalled inventoryを全配列で比較し、F側4回は180ファイル、R側3回は181ファイルで一致した。許可したmode差は固定12パスの0755→0644だけで、パス・bytes・SHAの別差分はない。ただし、この逐次観測からAppが検証した実root・manifest・process・時点までは確定できず、原因は未確定である。固定52B sentinelは初期と上書き復旧後の本文確認前まで保持された。Rが本文へ進めず、本文成功後の最終保持票はない。これは読書記録の消失を示す観測ではなく、実際のしおり・読書位置の保持を保証するものでもない。所有Simulatorのcleanupは成功した。

Dedicatedのcompact artifactはID `12723364073`、346,285B、SHA-256 `a3d37f795e53313017b65f9e16a45c017c6251d33001904a65f8dbcb65ad40b7`で、2026-10-27にRAM上で全体SHAを検証した。精密な取得時刻は未計測であり、観測票作成時刻やAPIの作成・更新日時と混同しない。全194項目のpath・type・重複等と、選択52項目のCRC・SHAを検証した。未選択項目のCRCは未検証で、raw ZIPは保存していない。選択読取票SHAは `16741e4bce6380cd8a8dd95a9910c2b0b688a993bcf13d88812db4a51f0aa340`である。復元する場合は上記runの同IDのcompact artifactを取得し、サイズと全体SHAを照合してから、JSON・ログだけを容量制限内で展開してF/R・7配列・sentinel・cleanupを読む。媒体やコードを実行せず、期限切れや照合不能時は復元済みと扱わない。

別snapshotであるmain778の新pushは、[Common40479965176](https://github.com/pero3dev/ai-agent-library/actions/runs/40479965176)と[Native40479965421](https://github.com/pero3dev/ai-agent-library/actions/runs/40479965421)が成功し、[Full40479965177](https://github.com/pero3dev/ai-agent-library/actions/runs/40479965177)が失敗した。FullのUIは22件・失敗1・1516.187秒、Publishedは14件・失敗1・1312.768秒、geometryは6件・失敗0だった。失敗は `testCancelContentFolderPickerPreservesFiltersAndReadingAndAllowsMoreActions` の前面pickerを一意に確定するassertで、固定main778の旧行658、case105.775秒である。原因は未確定で、API上のstep所要1800秒だけからtimeoutとは推定しない。ReleaseはUI失敗後にskipされた。270,041,453BのFull artifactは未取得で、宣言SHAを実取得・CRC検証済みとは扱わない。main778にSDK26・Runtime26・Dedicatedの新push runはなく、旧PRの結果を代入しない。main観測票SHAは `ba9b9c009c86ff4e41d0f2cf5a916dabf1c62c23d4e75f03e74e23e42681f66c`である。

次の実行で状態を区別できるよう、218を基準に4ファイルの失敗時診断候補を準備した。ContentValidatorは既存file-set guard・throw・利用者向け文言を保ち、DEBUGかつ限定UI-test suiteの失敗時だけ、実際にdecodeしたmanifestのSHA、process・時刻、宣言されたbundleと実validated root、件数と先頭8件の差分をAppのDocumentsへ記録する。1suiteの初回だけ、最大8192Bで、既存項目の削除・上書きやリンクへの追従は行わない。通常起動・Release・test環境なしでは記録しない。Nativeの既存32KiB失敗診断には `launchSuite` 1項目だけを加える。driverはpost installed証明後、既存の終了判定前に、所有data container内の固定名JSONを最大4件・各8192Bまで読む。通常ファイル・識別・内容とSHAを確認し、全体64KiB以下の要約を残す。JSON内のrootやURIはデータとして扱い、その値を使ってファイルを開かない。存在なし・部分記録・拒否を成功へ変換しない。

Publishedの候補は、picker待機が失敗した場合だけ `AILibraryFolderPicker` のJSON出力と `Public-UI-folder-picker-diagnostic` 添付を残す。prefix・JSON・改行を含め8192B以下である。最後のpredicateが既に取得した配列のコピーと、失敗後の別の逐次AX snapshotを区別し、frameworkが返した実際のwaiter結果と有限値のapp frameを記録する。nav/cancelは各最大10行、識別文字列は160文字まででURI・path・emailを伏せ、上限時は件数や拒否理由へ縮小する。poll中のAX照会は増やさず、15秒待機・tap・assert・成功時の本文判定を保つ。App/driver側も既存のvalidation・UI判定・専用job60分とstep合計55分を保ち、再試行や待機延長を追加しない。これらは所有Simulator内の逐次観測であり、原子的なsnapshotや原因修正を主張しない。

4ファイルの診断はこの追記準備時点では未公開で、実SDK型検査・追加後のHosted結果はない。App側3ファイルの私有manifest SHAは `8d9ed4052e6b8bf7e3da087f9f72230cb1b2383eda19ec30d056ba98f4f09140`、picker v2のmanifest SHAは `d4531f46b151a0fd60209ad22eb594df17d4641d2e2e4b5ca19f315ca3c820d5`である。新headと新runを得た後に、その結果を別に照合する。今回の記録更新は4文書のMarkdownlint、JSON、既存値・段落・件数の保持確認に限定し、SDK・Swift parse・生成・依存導入・API/Git変更を行わない。復旧の確認・取消・案内・復旧後再起動の専用画面受入、実機・VoiceOver、耐電断、記事改名・削除等とIOS-22全体は未完了で、TODO32行・完了12件を維持する。
