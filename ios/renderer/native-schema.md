# ネイティブ本文のデータ契約 v1

2026-10-24の代表3記事向け実装契約。2026-10-25にDebug用の専用記事と数式リンクの表示経路を追加した。端末ではSwiftUIを中心にネイティブ描画し、数式画像を含むリンクに限ってTextKitを使う。HTML・JavaScript・WebViewは使わない。Markdownの解析、Mermaid・数式の画像生成はビルド時に行う。この契約への対応と、実機での表示・操作の受入は別に確認する。

## パッケージ

manifestの`schema_version`は2。記事・音声・SHA一覧・revisionの既存構造を保ち、記事は`html_path`の代わりに`document_path`（`articles/*.json`）を持つ。記事ID・見出しID・音声IDは継承する。配布ファイルはJSON・PNG・ライセンス等のTXTとし、HTML・JS・CSS・SVGを端末用パッケージへ含めない。schema 1の旧パッケージはネイティブ版へ適合せず、同梱の正常版へ戻す。学習記録は消去しない。

### app・renderer・形式の対応

| appの系統 | renderer | manifest schema | document schema | 取扱い |
| --- | --- | --- | --- | --- |
| 旧WKWebView試作 | 旧HTML | 1 | HTML | 比較用。現行native版の取り込み対象外 |
| 現行native版0.2.0〜0.2.13 | native renderer v1 | 2 | 1 | 現行の受入対象。記事と全参照資産を検証後に切り替える |
| 現行appが知らない形式 | 未対応 | 2以外、またはdocumentが1以外 | 未対応 | 新規導入を拒否。保存済み版が不適合なら正常な同梱版へ戻す |

renderer v1はこの文書の型と検証規則の実装名で、manifestへ追加するフィールドではない。appのversion番号だけから受入可否を決めず、上記のschemaの組と内容検証で判定する。新しいblock・inline・必須フィールドや意味を既存readerが扱えない場合はdocument schemaを上げる。manifestの構造・許可資産・全体の互換性を変える場合はmanifest schemaを上げる。変更時はproducer・consumer・契約試験を同じ作業で更新し、旧形式への移行または拒否・正常版維持を明示する。見出しや本文の通常の改訂はschema変更ではなく、原本SHA・本文digest・revisionで区別する。

旧HTMLの生成ライブラリは比較用として残し、CLIは明示した一時出力だけを使う。通常の`Content`や`TestContent`へschema 1を書き戻す入口にはしない。旧経路の全削除はIOS-24、独立更新の配信元・真正性・容量管理はIOS-20以降の別工程で扱う。

開発時標準の全記事パッケージには、既存の許可JSONとして[任意の学習案内schema 1](learning-index-schema.md)を同梱する。`assets/learning/index.json`のSHAを通常の`files`とrevisionへ含めるため、manifest 2・document 1の構造は変えない。学習案内を使わない既存readerの本文互換と、新readerによる補助JSON自身の検証・UI受入は分けて扱う。

### 共通の容量境界

生成側と取り込み側の両方で、`manifest.json`を含む4,096ファイル・256 MiB以下とする。manifestは8 MiB以下、記事JSONは各16 MiB以下、PNGは各32 MiB以下。生成側はmanifestを最終的なUTF-8 byte列にしてから、資産と合計して出力前に検査する。全記事・代表版・fixtureに同じ境界を適用し、上限を超える拡張はIOS-15・21で別途設計する。上限を緩めるだけで未対応のappへ配布しない。

記事のmetadataには任意の`is_test_fixture: Bool`を持てる。通常の記事では省略し、専用記事には`true`を付ける。専用記事のIDは`test-fixtures/native-reader`、`source_path`は`ios/fixtures/native-reader.md`とする。本文JSONは同じschema 1を使い、テスト用のblock・inline型は追加しない。

開発時標準の`npm run ios:prepare`は全published記事を`Content`へ生成し、`ios:test:content`と`ios:test:package`で原文・実consumerを監査する。直接CLIのno flagと`ios:prepare:representative`は代表3記事を維持し、対応する原文監査とCoreSmokeにもrepresentative入口を用意する。`npm run ios:prepare:fixtures`（生成CLIの`--fixtures`）は代表3記事と専用記事1本を別の`TestContent`へ生成する。4記事を同じmanifestへ含め、専用記事から代表記事の見出しへの参照も検証する。schemaは変更せず、生成・起動手順は[iOSの手順書](../README.md)と[標準生成の記録](../../project/records/2026-10-25/ios-published-development-default.md)を参照する。

型・SHA・参照の汎用検証は両パッケージで共通とし、利用範囲はRepositoryとStoreで分ける。通常のRepositoryはテスト記事の取り込みを切替前に拒否し、保存済みの現行版にテスト記事があれば正常な同梱版へ戻す。`is_test_fixture`に加え、専用記事の予約ID・原文パスでも混入を判定する。Debugの専用Repositoryだけがテスト記事を許可する。

Debugの「本文表示テスト」は別のsheetを開き、一覧には専用記事だけを表示する。snapshotはリンク先を含む4記事を保持する。専用のUserDefaults suiteとコンテンツ保存先を使い、通常のしおり・本文位置・音声設定を変更しない。テスト画面の音声・取り込みは無効にし、Release構成には入口と`TestContent`を含めない。未生成の場合は利用できない旨を画面で案内する。

### 音声時間の境界

この試作のschema 2では、音声の`duration_seconds`を有限の正数かつ86,400秒（24時間）以下に制限する。各chapterの`start_seconds`も有限で、0以上かつ当該音声のduration未満とする。上限超過のmetadataを切り詰めて受け入れることはせず、取り込み検証で拒否して現在の正常版を維持する。

表示時も整数への変換前に防御する。非有限値・負数は0、24時間を超える有限値は86,400秒に収め、再生位置・全体時間・chapterの画面表示と読み上げに共通して使う。この境界はパッケージの受入条件であり、manifestの音声情報から実際の配信音声の長さを検証したことにはしない。

## 本文

各本文JSONの必須項目は`schema_version: 1`、`article_id`、`source_sha256`、`blocks`。

blockは必須の`id`・`type`と型ごとのフィールドを持つ。未知の型や不正な参照を検出する。

| type | フィールド |
| --- | --- |
| heading | `heading_id: String`, `level: Int`, `inlines: [Inline]` |
| paragraph | `inlines: [Inline]` |
| list | `ordered: Bool`, `start: Int`（1基準）, `items: [{id: String, blocks: [Block]}]` |
| quote | `blocks: [Block]` |
| code | `language: String`, `text: String` |
| table | `table: {header: [[Inline]], rows: [[[Inline]]], alignments: [String]}`。alignmentはleft/center/right |
| diagram | `asset: Asset`, `source: String`, `accessibility_text: String` |
| math | `asset: Asset`, `source: String`, `accessibility_text: String` |
| thematic_break | 追加フィールドなし |

Inlineは`type`と以下のフィールドを持つ。

| type | フィールド |
| --- | --- |
| text, code | `text: String` |
| strong, emphasis | `children: [Inline]` |
| link | `children: [Inline]`, `target: Link` |
| math | `asset: Asset`, `source: String`, `accessibility_text: String` |
| soft_break, hard_break | 追加フィールドなし |

Linkは`kind: article`と`article_id`・任意の`heading_id`、または`kind: external`とHTTPSの`url`。同一記事内fragmentもarticle形式。記事ID・見出しはmanifestの参照先と照合し、外部URLは資格情報なしのHTTPSとする。

linkの`children`は文字列だけでなく、数式画像のみ、または文章と数式の混在も表せる。そのリンクを含むテキストに限ってTextKitのネイティブテキスト添付画像を使い、画像の範囲にもリンク属性を付ける。通常のSwiftUI Text経路と同じ型付きリンク処理へ接続し、HTMLのインポートやWebKitを使わない。選択範囲の数式画像はコピー時に元のTeXへ置き換える。リンクの押下・読み上げは[専用記事の実施記録](../../project/records/2026-10-25/ios-native-fixtures.md)で追跡する。

Assetは`light`・`dark`（manifest内PNG相対パス）、`width`・`height`（表示用point）、`scale`（PNGのpixel密度）と任意の`baseline`（画像下端から文字baselineまでのpoint）を持つ。width・height・scaleは有限の正数、baselineは有限の非負数とする。数式には元のTeX、図にはMermaidソースも残し、ネイティブUIからテキスト表現を開けるようにする。

PNGは各辺8,192pixel以下、合計32,000,000pixel以下とする。表示寸法は各辺8,192point以下、scaleは4以下とし、PNGの実寸と照合する。大きい資産は生成時に縦横比を保って全体を縮小する。

block IDは見出しIDと内容由来のdigest等から決め、異なる段落の挿入だけで既存blockのIDを変えない。同一内容の重複には同じ見出し内の出現番号を付けられる。配列indexだけをIDにしない。

代表図の流れを説明する文章は`ios/content-selection.json`の`diagram_descriptions`に置ける。キーは図の生成要求のdigestであり、図の変更で対応しなくなった説明や、設定時の説明欠落は生成前にエラーとする。図の`accessibility_text`にはその説明とSVG・HTML双方から取得した全ラベルを含める。自動生成の説明が実際に理解しやすいかは、実機のVoiceOverで確認する。

## Swiftで共有する型とAPI

- `NativeDocument`, `NativeBlock`, `NativeInline`, `NativeAsset`, `NativeLink`, `NativeTable`, `NativeListItem`。型判別の`type`・`kind`は上表の文字列。本文の非共通フィールドはOptionalとし、検証時に型ごとの必須を確かめる。
- `NativeDocument`は`schema_version`, `article_id`, `source_sha256`, `blocks`。
- `NativeBlock`は`id`, `type`と上表のフィールド。`NativeInline`も同様。
- `NativeAsset`は`light`, `dark`, `width`, `height`, `scale`, `baseline: Double?`。
- `ContentSnapshot.document(for article: LibraryArticle) throws -> NativeDocument`で検証済み本文を取得する。
- `ReadingPosition`は従来の`heading`・`fraction`・任意の`blockID`と保存キーを残し、任意の`anchor: NativeReadingAnchor?`を追加する。旧JSONからもdecodeできること。anchorはversion 1、本文JSONの`documentDigest`、意味内容の`blockFingerprint`・任意の`headingFingerprint`を持つ。未知・不正anchorだけを無視し、ほかの保存を失わない。
- `ReadingStore.record(articleID:heading:fraction:blockID:anchor:)`、`LibraryStore.record(articleID:heading:fraction:blockID:anchor:)`の`blockID`・`anchor`はdefault nil。従来の呼び出しを維持する。
- `ReadingStore.position(for:document:documentDigest:)`で検証済み本文に照合する。digestが同じならblock ID、異なるなら一意な意味内容fingerprint、同一内容が複数なら一意に照合した見出し内の一意な本文、見出し、割合の順に選ぶ。fingerprintはID・slug・生成画像のパスや寸法を含めない。旧保存はblock ID→heading→割合の従来fallbackを維持する。getterは永続記録を書き換えない。
- 割合はblock単位の近似であり、block内の文字・pixel位置や改訂後の同一位置を保証しない。明示的な検索・fragment・目次の移動を保存位置より優先する。

本文・資産の参照はmanifestと安全な相対パスへ限定し、ファイル数・本文深さ・要素数・PNG寸法等へ上限を設ける。既存のSHA検証・symlink拒否・原子的な切替を保つ。
