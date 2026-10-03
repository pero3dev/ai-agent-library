# Nextraのビルド用glob互換入口

Nextra 4.6.1のページ収集が使うasync関数とsync、cwd、onlyDirectoriesをtinyglobby 0.2.17へ接続する私有パッケージです。fast-glob全体の互換実装ではありません。対応外のオプションと4096文字を超えるパターンは拒否します。

bracesの修正版がない[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)に対応するため、Nextra配下だけをこの入口へ置換します。依存監査の省略やパッケージ版の偽装は行いません。tinyglobbyの[移行手順](https://superchupu.dev/tinyglobby/migration)に従い、braceExpansionを有効、expandDirectoriesを無効にします。

単体試験はNextraの実パターン、空の選択肢、Markdownとmetaの収集、動的・私有routeの除外をfixtureで確認します。静的ビルドと全routeの検査も必要です。Nextraの更新時は実際の呼出箇所・対応APIを再確認し、上流で解決したらoverrideとこの入口を外します。
