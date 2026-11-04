# TypeScriptソースへの全面移行 — 作業記録

開始日: 2026-11-04(JST)。状態: 実装・ローカル統合検証・最終独立レビュー完了。提出後のCI・マージ・公開確認は対応PRの最終証跡で照合する。

## 作業契約

- 目的: 前回のstrict型検査導入に続き、変更可能な自前実装をTSソースへ統一する。JSDocで型検査できることだけを今回の完了条件にしない。
- 許可根拠: ユーザーの「全範囲全て完了するまで自律的に作業」と、その後の「続きを」という依頼。実装、必要な互換調整、依存準備、検証、通常のGit/PR/mergeと公開確認までを進める。有料APIや個人設定変更は含めない。
- 元HEAD: `518f30523c66a18c8a8ecc60fc6e498b56909109`。開始時はclean。作業ブランチは`codex/typescript-complete`。
- main同期: `4a70ea5df998d03349bcecb4bf57b2a9a32ac367`までをfast-forwardで取り込んだ。並行するiOS実装・受入記録はmainの内容を保持し、本作業の差分へ混ぜない。
- 所有範囲: 残るJS実装126件（scripts53、tests45、iOS20、hooks4、CI1、サイト設定3）、関連する型設定・coverage契約・実行入口・CI・README・本記録。CIや設定に埋め込まれたJSも棚卸しし、実装をTSへ抽出する。既存の薄い入口64件は互換用途として管理する。
- 保全: SHA固定4件（性能観測実装3・固定試験1）、過去証跡6件、vendor1件は現契約で保持する。Swift/PBX、記事本文、性能予算、既存観測値・run永続状態を移行都合で変更しない。外側のPython observerに残る実行JSは今回の対象へ加え、現行コードのfingerprintを更新する。旧コードに基づく観測を新コードの証跡へ読み替えない。
- 終了条件: 変更可能なJS実装0件、未分類0件。残るJSは固定ASTの互換入口・TSからの生成物・保全対象の理由を持つ。TSの型記法、strict/noEmit、型除去で実行できる構文を使い、any・抑制・strict緩和で通さない。最終内容の独立レビュー、必要CI、マージと公開確認を揃える。

## 実装方針と検証

通常のNode処理とテストは同じディレクトリのMTS本体へ移し、既存MJSパスを薄い入口として維持する。CJS loaderはCTS本体とCJS入口に分ける。ブラウザー用readerはTSソースを正本にし、コンテンツ生成時にNode標準の型除去で配布用JSを生成する。独自loaderやbootstrap用の事前コンパイルは追加しない。

型注釈を除いた実行ASTを元実装と比較し、CLIの直接起動・自己再起動・fixtureコピー・import.meta.url・エラーハンドラーを確認する。型検査、共通check、サイトunit/build/browser、最低Node22.22.2、Windowsの対応範囲、必要なCIを実施する。source hashによる証跡は委譲先TS本体も対象へ加える。

## 途中で確認した事項

TypeScriptのJSDoc codefixは括弧なしの単一arrow引数や型述語を誤変換する場合があった。原本を保存し、引数の括弧付け・単回変換・TS構文でのinline cast処理へ修正し、構文と実行ASTを別々に確認している。

hook-coreの薄い入口化で先頭のroot識別markerが失われ、PreToolUseが安全側で停止した。元markerと正規root内のTS実装の実体照合を保ち、正当なローカル編集の許可と生成物編集の拒否を再確認した。フック設定の無効化は行っていない。

前回の[段階移行記録](../2026-11-03/typescript-migration-implementation.md)と当時の観測値は履歴として保持する。以下は今回の実装・検証の記録である。

## ソースと入口の最終分類

残っていた126件の自前JS実装をTSへ移し、CIの11ワークフローにあった35件のNode実装もMTSへ抽出した。共有する入力契約3件を追加した。設定に埋め込む必要があるhook bootstrapと公開HTTP検証childも、型検査するTS関数から実行用コードを組み立てる。

分類検査の対象は、追加監査とmain統合を含む529ファイル。TS実装307、宣言18、互換入口193、SHA固定4、過去証跡6、vendor1へ分類する。変更可能なJS実装は0。17ワークフロー内のNode heredoc/eval/print実装も0。単にcheckJsで検査するJSを完了扱いにしない契約と、その拒否試験を追加した。最終件数・未分類と型検査の各programは[分類・検証結果](typescript-source-migration.json)で照合する。

193件の互換入口は、ASTで制限するside-effect 92、reexport 60、CLI 38、default-reexport 2、CommonJS 1。CLIは追加でSHAを固定し、従来のMJS/CJS起動パスを維持する。ソース実体の束縛が必要なiOS証跡にはMTSも加え、旧証跡のsource hashや性能観測値は変更しない。

## 互換性の確認範囲

型注釈除去後の実行ASTを原本と照合し、fixtureのコピー先・実装パスの追加、実体を照合するhook強化、unknown入力の検証を個別にレビューした。CI抽出はshell、環境変数、条件、timeout、予算、selector、cleanupの構造も比較した。optionalな行を選別する箇所は、旧実装が許していた無関係なprimitive/null行の扱いを旧新VMで比較して修正した。

Node 22.22.2でCIドライバーの構文検査、旧新の選別・cleanup比較、記事集計の実行を確認した。cleanupのVM比較は実Simulatorを起動していない。archiveの診断ではError以外をthrowした場合のfallback表示だけが限定差で、失敗状態は維持する。Windowsで実行できないmacOS/Swift/Xcode試験と、ローカルの型検査・モック比較を区別する。

公開HTTP検証childの実通信は、既知のPR #329・main `518f305`の公開4URLを再照合して成功した。これは変更した検証処理の互換性確認であり、本作業の公開完了証跡には使わない。本作業のPR・main CI・Pages・HTTP確認は別途追記する。

追加の完了監査で、テスト内の子・孫processとPython observerに埋め込んだ実行JSも検出した。テスト用実装は型付き関数の実行用シリアライズへ移す。observerのschema・producer・verifierはTS正本を使い、現行コードのfingerprintと純粋fixtureを同期する。importだけのfixture、意図した不正JS入力、VMの呼出glue、外部生成物は実装の移行件数へ加えない。

先行した共通checkは1,569件中1,459成功、100skip、10失敗。10件はclipboard回帰試験が抽出前のYAML heredocを直接読むことが原因だった。workflowの実参照からTS driverを読み、型除去して同じVM・期待値へ接続した。関連32件は成功、skip0。修正後とmain取り込み後の共通checkを別途行う。

サイトはNode24.22.1でunit 99/99、5系統のstrict型検査、静的ビルド230/230ルートが成功した。初期JSは12script・raw962,476B/gzip307,969Bで前回の基準と同じ。全17workflowはActionlint1.7.12で成功したが、ローカルWindowsにShellCheckがないため、その外部検査はLinux CIの結果と分ける。root/website/ios-toolsは各lockfileで再インストールし、依存版を変更していない。low/moderateの既存監査結果を破壊的な自動fixで解消した扱いにしない。

サイトの表示・検索・公開安全性を確認するbrowser35件は34成功、長時間taskの性能基準1件が460ms/上限200msで失敗。同ソース・同200ms基準を単独で再検証して成功した。子・孫processの追加試験も高負荷下の期限超過3件を保持し、低負荷直列でNode22/24双方22成功・失敗0・既存Windows skip13を確認した。期限・性能基準・skip条件は変更していない。全browserとLinux/macOS実行は最終headのCIと区別して照合する。

## 最終ローカル検証と提出条件

| 検証 | 結果・範囲 |
| --- | --- |
| 共通check | Node24.22.1で終了0。型検査6系統、単体1,579件中1,475成功・失敗0・skip104、icon・Markdown・文書・リンク・難易度・TODO形式・harness・配置・Git設定検査が成功 |
| 分類 | main統合後529件すべて分類、TS実装307・実装JS0・互換入口193・未分類0・workflow内Node実装0。semantic診断と分類証拠を分けて確認 |
| サイト | main統合後unit110/110、型検査5系統、230/230ルート生成。新規出力のbrowser7件とCSP/JS無効時2件も成功。移行単独のbrowser結果と性能1件の同基準再検証は前節のとおり |
| 最低Node | 22.22.2でCI構文・記事集計、23子関数の24.22.1とのbyte一致、子process回帰22成功、audio/eval回帰67成功、Notice entry回帰5成功を確認 |
| Notice外側 | schema・producer・verifierをTS正本へ移行。固定9契約・argv式・選択6関数のAST一致、pure fixture本文はEXPECTED以外同一。native WindowsはSIGKILL未提供により旧新同じ失敗、隔離したSIGKILL=9のPOSIXモデルでは旧新26/26。実macOS観測の成功とは扱わない |
| 最終レビュー | 実装担当を交代した独立レビュー、埋め込みJSの再監査、設定・依存順の統合レビューを承認。未解消指摘0。ソース・入口・例外・設定等560件と追加監査44件のSHAをローカルへ保存 |
| 提出差分 | 新MTSの型宣言末尾・EOF空白27件を正規化し、前後のparser token・AST一致を検証。stage済み全差分の空白検査が成功 |

Windowsでは、既存の不変POSIX専用Notice試験1ファイルをcollectorが明示的にnot-runとする。104skipとは別であり、Linux/macOS CIでは原文を実行する。104件には後述の上流Bash試験4件を含み、移行でskip条件を増やしていない。実機iPhone、VoiceOver、物理Safari/AirPods、有料音声生成・実Agentは今回のローカル検証へ含めない。

初回head `55c5c9a`の実CIは、Linux単体1,582件中1,563成功・19skip・失敗0だった。Windowsではhookの実体照合が7件失敗した。Hostedの一時フォルダーではimport.meta.urlに8.3短縮名が残り、native realpathで得た期待位置との文字列比較が同一ファイルを拒否していた。実モジュールURLもnative realpathで正規化し、期待位置のnative==lexical、marker、symlink・別root実装の拒否は維持した。実短縮名からの起動で旧版exit2・修正版exit0を両クライアント/Node22・24で再現し、全hooksは各25/25成功。short entryの正負と別rootの実MTS拒否を恒久試験に加え、独立レビューを取り直した。修正直後の共通checkは1,575件で終了0。新headのHosted検証はPRの最終証跡へ記録する。

PRの最終head、必須11check、実merge SHA・tree、main CI・Pages deploymentと公開4URLのHTTP/本文確認は、commit後に得る外部証跡として対応PRの最終コメントで管理する。旧PR #329の公開証拠を今回の完了証拠へ流用しない。詳細ログ・比較・snapshotは非追跡の`.local/ts-complete/`に保持する。

## Web出力機能を追加したmainの統合

CI待機中にmain `a5f99d8086de4c653ee2bcab5df32c3c2a7801d8`へ[llms.txt・Markdown版・索引JSON](llms-markdown-index.md)の16ファイルが追加・変更された。実装を保持して通常mergeで統合し、`harness/typecheck.json`の競合だけを、既存190入口と新規3入口の和集合で解決した。他の契約値と既存入口は変更していない。追加5実装もTSであり、分類は521件/TS302から529件/TS307へ増える。サイト機能自体の設計をこの移行で変更しない。

統合後はunit110件、5系統の型検査、静的230ルートと新規参照用出力219ファイルの生成、新規出力browser7件・CSP/JavaScript無効時2件が成功した。初期JSの12script・raw962,476B/gzip307,969Bは変わらない。追加3入口とTS必須契約、既存設定・loaderとの相互依存は別担当が独立レビューし、未解消0。

iOSの直接・間接実行入力を広域735ファイル/約8.18MBで比較し、`d568fa9`から統合indexへblob・mode差分、追加・削除は0、実runtimeのraw byte差も0と独立確認した。既存Macの証跡は同じruntimeソースの実証として保持するが、receiptのhead/treeを統合後へ読み替えず、最終headで実行したとは扱わない。変更したWeb/契約と共通検証は統合後に取り直し、必須CIも最終headで確認する。

## 長文スクロール観測の選択を追加したmainの統合

さらにmain `758ef6aac4acc3aabd895a2e1b2f84a6298c32d5`へ、自リポジトリのPRでは長文スクロール観測を選ぶCI変更が入った。上流のworkflow・concurrency・環境変数による入力検証を保持し、既存の型付きdriverを引き続き呼び出す。追加されたJSテスト99行は同じテストのMTS本体へ型付きで移し、MJSは従来の薄い入口のまま競合を解消する。新しいTS実装ファイルや入口の増減はない。

この統合では性能workflowの入力が変わるため、先行headのlaunch観測を長文スクロールの実行証拠に転用しない。新headの選択試験・共通check・必須CIを確認し、実際の長文観測は終了状態とexport・cleanupを分けてPR証跡へ記録する。Web実装・出力・依存・Swift/PBXはこのmain差分では変わらない。先行したWeb検証と、同じ入力で実行したMacの証跡は元head/treeのまま保持する。

統合後の共通checkは上表の1,579件で終了0、分類529件と11系統のstrict契約は維持した。最低Node22.22.2の関連試験は62件中39成功・失敗0・POSIX対象外23skip。上流追加4件の実Bash試験はこの23skipに含み、Hosted Linuxの結果と分ける。型除去後の追加AST一致、既存MTS全文・MJS入口のbyte保持、workflowの上流差分一致を別担当が独立確認し、未解消0で承認した。
