# 任意の学習案内データ v1

この補助形式は、全published記事を同梱する候補向けに章順・タグ・学習ルート・用語集を保持する。本文の[manifest 2・document 1](native-schema.md)を変更せず、許可済みのJSON資産を1本追加する。代表3記事、専用記事を含む4記事、明示した一時全記事生成は従来の出力を維持する。

## 配置と互換性

固定パスは`assets/learning/index.json`。`--published-library`だけが生成し、既存の`manifest.files`へSHA-256を載せる。補助JSONの内容変更はそのSHAを通じて既存のrevision計算へ入る。manifestへ新しいフィールドを追加しない。

このファイルは任意資産であり、本文を読むための必須条件ではない。既存readerは列挙されたJSONのパス・SHA・容量を検証した上で、未知の学習案内を利用せず本文を読める。新readerは不在を許容し、利用するときは補助JSON自身の形式・参照を追加検証する。生成基盤の追加は、学習案内のUIや全記事の表示受入の完了を示さない。

補助JSONの`schema_version`は1。未対応versionを意味の分からないまま表示しない。本文形式の新しいblock・inline・link kindを追加する場合は、この補助形式の版とは別に本文契約を改訂する。

## データと正本

| フィールド | 内容・正本 |
| --- | --- |
| `source_sha256` | 選定された全記事、各章README、GLOSSARYの相対パスからSHAへのmap。学習ロードマップも公開記事として選定する |
| `article_tags` | 記事IDからタグ配列へのmap。記事front matterのタグを使用する |
| `chapters` | `id`・`title`・`description`・`article_ids`。章ディレクトリ順、READMEの収録表の掲載順を保持する |
| `routes` | `id`・`label`・`persona`・`steps`。学習ロードマップの読者タイプ別表からA〜Hの順で抽出する |
| `glossary` | 原文H3由来の`id`、`name`、任意の`english`、最初の定義段落の`summary`、当該節の全`links` |

routeのstepは`inlines`を持つ。要素は`{type: text, text}`、または`{type: link, text, target}`。リンクの前後にある指示や任意条件も文字列で保持する。用語のlinkは`label`・`target`を持ち、リンクのない用語は空配列を使う。

targetは次の3種類に限定する。

| `type` | フィールドと条件 |
| --- | --- |
| `article` | 選定済みの`article_id`と、任意の存在する`heading_id` |
| `chapter` | 存在する`chapter_id` |
| `external` | 資格情報を含まないHTTPSの`url`。明示した外部参照として扱う |

この`type`は補助JSON内だけの識別子であり、document 1の`NativeLink.kind`ではない。サンプルへの外部リンク等をオフライン本文へ変換したとみなさない。用語のIDは原文の見出しに由来し、Web用語カードに同じアンカーがあることを保証しない。

Webの手動ルート配列や、最初の詳細リンクだけを返すWebの用語表示データを生成元にしない。Markdown正本を共有する構成であり、WebとiOSの抽出処理を共通化したという意味ではない。`source_sha256`は正本との対応を記録する情報で、発行元の真正性や配信署名を保証しない。

## 検証と上限

記事タグのID集合は選定記事の集合と一致させ、各記事を自分の章へ1回だけ収録する。章・route・用語のIDは重複させず、記事・見出し・章へのリンクを照合する。コードフェンス内の用語記入例は実際の用語に数えない。未知のlink typeや、解決できない内部参照を黙って捨てない。

| 対象 | 上限 |
| --- | --- |
| 補助JSON全体 | 4 MiB |
| JSONの入れ子 | 12段まで。重複キーとUnicode escapeで同じになるキーも拒否する |
| 読み取る正本1ファイル | 16 MiB |
| 各文字列 | UTF-8で16 KiB |
| 記事、用語 | 各1〜2,000件 |
| 章 | 1〜100件 |
| 学習route | A〜Hの8件 |
| routeのstep、stepのinline、用語のlink | それぞれ128、64、256件 |
| 記事ごとのタグ | 64件、各128文字以内のASCII小文字・数字・ハイフン |
| 見出しfragment | UTF-8で256 bytes |

これらに加えて、manifest込みのパッケージ全体の件数・容量・許可拡張子・SHA検証を適用する。通常3記事・専用4記事の不在時互換、全記事候補の旧reader受入、学習データ自身の意味検証、実画面の操作を別の検証面として記録する。
