# 動的図解のバックアップと機能削除

2026-10-03開始。[採択計画](../../plans/engineering/dynamic-diagram-removal-and-recovery.md)に沿って実施する。

- 目的: 全ソース・未提出の作業状態・保存時の表示を復元できるよう保管し、読書連動・再生・操作付きの動的図解一式をサイトから取り除く。本文・既存Mermaid・数式を保持する。
- 所有: バックアップの保存用コピー・復元用コピーと隔離した削除作業ツリー。削除PRでは図解専用のcomponents/lib/登録/test/scriptと、同期処理・MDX・記事page・サイト案内の接続部分、必須CIのために必要な依存修正、projectの状態案内を扱う。元のP4/P5制作ツリーと他用途のworktreeを変更・削除しない。
- 開始状態: 元branch `feat/case-decisions-reading-diagrams`、HEAD `7e39c4bb3c7abd9e146da6e3f9b4ab889decffa6`。main `b321a0bf94aa2db6d19d6e1ceffb2f0a2cc46d2b`、最後の公開成功 `c39ac51670de8fdcf6a5e497a9bdccb75e7453da`。PR #142はOPEN。元indexは0件、P4/P5と計画の未保存変更がある。
- 許可: このセッションの「では完了まで自律的に作業を進めてください」と保存先の直接指定。バックアップ・私有先への保存・復元確認・PR #142の終了・通常PR・必須CI・squash・Pagesまで進める。任意レビュー・追加ハッシュ台帳・大量の新規証跡は省く。
- 保存先: ローカル `C:/backups/ai-agent-library/dynamic-diagrams/2026-10-03/`、[専用の非公開GitHub Release](https://github.com/pero3dev/ai-agent-library-diagram-backup/releases/tag/dynamic-diagrams-2026-10-03)（ユーザーがOneDriveから変更指定）。完全オフライン再ビルド用の環境・依存は対象外。
- 検証: 完全bundleからの独立clone、ソース・未提出状態の比較、公開版と制作版の静的表示・代表7型の操作、二か所目からの取得確認。削除後はnpm ci・共通check・サイトunit・静的build・残す機能のbrowser、Git形式と必須9 CI。公開後は表示確認のみ。
- 終了: 二か所に復元確認済みバックアップがあり、動的図解を除去した通常PRの必須CI・squash・main CI・Pagesと公開表示を確認。保存物と復元入口を残す。
- 現在: バックアップの保存・外部取得・独立復元を完了。PR #142は未マージのまま終了し、最新mainから隔離した削除作業を開始。削除PR・公開は検証後に進める。

## バックアップの結果

- ローカルの指定先と非公開GitHub Releaseに、source.bundle・workspace-support.zip・site-last-published.zip・site-local-working.zip・RESTORE.md・restore.pyの6ファイルを保存した。GitHubから別フォルダへ全6ファイルを取得し直し、バイト一致を確認した。元PCのTEMPや元cloneは復元の前提にしない。
- 保存点は、公開成功#140、未公開main #141、未マージ#142、未公開P4/P5を含む全制作状態の4つ。全制作の保存commitはe44c01eed472214167b455cea6f5ef42ac1bc6c0。ローカル独立cloneで全ソース3318ファイルの実バイト一致を確認し、全制作ソースの静的buildが成功した。代表7型のPC表示・主要操作は7/7成功。
- GitHubから取得したbundleとsupport ZIPだけで独立cloneを作り、元HEAD・作業差分・index差分・tracked/untracked区分の一致、4保存点と5516保存ファイルの展開を検査した。indexは保存時と同じ0件。公開版・制作版のZIPをそれぞれHTTP表示し、自己注意とAgentループの表示・スライダー操作を確認した。
- Gitの正規化だけでは元CRLFの実バイトを保持できないため、追跡ファイルの実バイトもsupport ZIPへ収録した。復元手順は長いWindowsパスを処理し、実差分がないCRLFファイルのstatだけを検査後にrefreshする。元の制作ツリーには適用しない。
- 非公開バックアップrepoのActionsは、過去のworkflowが保存branchで起動しないよう無効にした。元リポジトリのCIは変更しない。OneDriveへの保存・同期・クラウド取得は行っていない。

## 削除と検証

本文・既存Mermaid・数式・表・通常の目次、音声・検索・依存マップを維持する。図解専用components、models/bindings、登録、専用試験・公開検証キットと、MDX・同期・記事pageの接続を削除する。過去の計画・実施記録は経緯として残し、現行入口から廃止状態と復元先を案内する。

必須CIの依存監査を阻んでいたbracesには修正版がないため、Nextraが使う限定したglob APIをtinyglobbyに接続して該当依存を除く。DOMPurifyは修正済み3.4.16へ固定する。依存監査は省略せず、呼出API・実パターンの単体試験と静的ルート網羅を検査する。@xyflow/reactは依存マップで使うため保持する。

## ローカル検証の完了

- ルートとwebsiteで通常のnpm ciを実行した。共通npm run checkは成功（単体455件中452成功、Windowsでリンク作成権限のない3件はskip）。記事規約・Markdown・相対リンク・ハーネスの検査が成功した。
- サイト単体73/73、npm auditは脆弱性0件。公開相当のclean静的buildは223/223ルート、230 HTMLのスキップ先、16セクションの網羅に成功した。既存Mermaid・数式・検索・依存マップ・メニュー等のブラウザー119件が成功し、元図解3記事の見出し件数・順序・通常表示・図解UI不在も3/3成功した。
- docs/のGit差分は0件。図解への実行時import・登録・ページ配置情報を除き、MDXガードは一般の装飾と実行可能構造の拒否を保持する。過去記録で削除対象を指す相対リンクだけは保存時commitへのリンクへ変更した。
- 図解の公開検証キットも廃止対象として削除し、履歴と私有バックアップに保存した。任意の独立レビュー・追加ハッシュ台帳・全図解の再受入は実施していない。公開後は表示確認だけを行う。

この記録は提出前の検証時点を示す。削除PRの必須9チェック・squashの実merge・main CI/PagesはGitHubの当該PRとActionsを正本とし、完了報告で実際の結果を案内する。
