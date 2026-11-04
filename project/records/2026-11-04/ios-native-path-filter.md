# iOS native regression の起動条件

Issue #346。目的は、入力と無関係な記録だけの変更でmacOSジョブを起動しないことです。試験の内容と必須チェックは維持します。

## 入力と根拠

| パス | 読み込み元・理由 |
| --- | --- |
| `ios/**` | Xcode project、Swift、renderer、fixture、content-selection、native test/helper、描画依存lockfileを含む |
| `docs/**` | representativeと全published記事の本文・front matter、学習導線の章README |
| `scripts/build-ios-native-content.*` | workflowが実行する互換入口とTypeScript実装 |
| `scripts/lib/ios-*` | content、native assets、audio identity、learning contentとその型の推移的依存 |
| `scripts/lib/md-utils.*` | published記事数を求めるarticle-countのfront matter解析 |
| `scripts/lib/markdown-links.*` | learning contentのリンク解析とnative learning監査の共通実装 |
| `scripts/lib/json-guards.*` | content/audio/learning解析が使う共通入力検証 |
| `website/audio/catalog.json` | 同梱音声のidentity照合とmetadata |
| `LICENSE` | 生成packageのNOTICE |
| `package.json`・`package-lock.json` | rootの依存インストールとworkflow中のnpm scripts |
| `.github/scripts/ios-native/**` | published記事数の算出 |
| `.github/workflows/ios-native.yml` | 実行環境と手順自体 |

pushとpull_requestに同一のYAML anchorを使用します。別のiOS workflowは実行内容が異なるため条件を一括共通化しません。`project/records/**`、`research/**`だけの差分は対象外です。

## 検証

静的な入力一覧とactionlint、`npm run check`に加え、実GitHubのdocsだけ・iosだけ・記録だけの検証PRで起動条件を確認します。検証PRは本文の意味を変えない差分を用い、確認後に閉じます。実PR番号と結果は統合PRとIssueの完了コメントで追跡します。
