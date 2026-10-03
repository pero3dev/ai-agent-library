# 公開資産の既存ライセンス宣言の棚卸し

Issue [#165](https://github.com/pero3dev/ai-agent-library/issues/165)。確認日2026-10-03（日本時間）。入力HEADは`d990973c2c02b6108cd9911fc06e45b3a29f9332`、追跡パスは`git ls-tree -r --name-only <HEAD>`、音声は同HEADの[公開カタログ](../../../website/audio/catalog.json)から確認しました。

この台帳は既存の宣言・由来・確認先を記録します。新しいライセンス、優先順位、権利帰属を採択しません。「未宣言」は独立した配布ライセンスを資料から特定できない意味です。法的違反・適法性の判定ではありません。

## 宣言と区分

| 資産・範囲 | 由来 | 既存宣言 | 宣言元 | 第三者規約・確認先 | 分類 | 確認が必要な点 |
| --- | --- | --- | --- | --- | --- | --- |
| `docs/`、GLOSSARY、ROADMAP、root/research/projectの散文Markdown | リポジトリの執筆・調査 | CC BY 4.0 | [LICENSE](../../../LICENSE) Documentation節 | LICENSEのCCリンク、寄稿者・維持担当 | 単一宣言 | 引用元・外部リンク先の文章へ同宣言を拡張しない |
| `examples/`、`website/`、`scripts/`のコード | リポジトリ実装 | MIT | LICENSE Code節 | 依存は個別package・配布元の宣言 | 単一宣言 | コードの宣言は依存パッケージの再ライセンスを意味しない |
| 上記3ディレクトリのREADMEなど散文Markdown | コード領域内の運用文書 | CC BYのother prose Markdown、MITのeverything underの両方 | LICENSE両節 | 維持担当が元の宣言意図を確認 | 重複 | proseとディレクトリ宣言の優先順位は未採択 |
| `website/content-src/`の文章を含むMDX | 手書きサイトページ | ディレクトリにMIT。散文の意図は資料上未確定 | LICENSE Code節 | 維持担当、元記事とページの来歴 | 単一宣言・適用意図未確定 | MDXの文章と実装をどう区分するかは今回決定しない |
| `website/content/`、`generated/`、公開HTML・Pagefind・記事由来文章 | docs等から生成、Git管理外 | 元記事CC BYとwebsite領域MITが重なり得る | LICENSE、[サイトの正本対応](../../../website/README.md#生成物と正本の対応) | 維持担当、[sync-content](../../../website/scripts/sync-content.mjs)、元記事 | 重複・適用意図未確定 | 生成されただけで原文の宣言を変更したと扱わない |
| `website/public/favicon.svg` | サイト所有のSVG（追跡ファイル） | websiteのMIT | LICENSE Code節 | 維持担当、当該ファイルのGit履歴 | 単一宣言 | 見た目・外部ブランドの権利まで推定しない |
| 音声の元記事・対話台本・MP3 | 元記事→生成/編集台本→VOICEVOX Nemo | 元記事CC BY、カタログのNemo credit/声別規約。MP3/未追跡台本の独立ライセンスは未特定 | LICENSE、[音声運用](../../../automation/audio/README.md)、catalog | 維持担当、制作authorship記録、Nemo規約 | 独立配布宣言未確認 | 原文の宣言・台本の来歴・合成音声の規約を分け、声のcreditをMP3の包括ライセンスと扱わない |
| Node/Python依存、Nextra同梱・VOICEVOX/FFmpeg等の外部配布物 | npm/pip/upstream配布 | 個別package/配布物のLICENSE・NOTICE | root/website lockfile、各requirements、導入スクリプト | 各package metadata・同梱LICENSE、配布元 | 第三者宣言 | root MITを一律適用しない。FFmpeg/Nemoのバイナリは追跡・同梱なし。使用する実配布物で規約・NOTICEを確認 |

## README画像の全件

[assets/readme/README](../../../assets/readme/README.md)の由来記録と、追跡中の8素材を照合しました。画像の独立ライセンス宣言は特定できません。既存MarkdownのCC BYをPNG/SVGへ推定適用しません。

| 資産 | 由来 | 既存宣言・宣言元 | 第三者規約・確認先 | 分類 | 未確定理由・次の確認 |
| --- | --- | --- | --- | --- | --- |
| `assets/readme/hero.png` | 内蔵imagegen原画をSharpで縮小 | 独立宣言なし。assets READMEと[制作記録](../2026-09-20/github-showcase.md) | 維持担当、制作時のサービス規約・原画記録 | 未宣言 | 元画像の利用条件と作者による配布宣言を確認 |
| `assets/readme/social-preview.png` | heroと同一素材 | 同上 | 同上 | 未宣言 | heroの確認と共有画像の扱いを同期 |
| `assets/readme/learning-map.svg` | 編集可能なサイト紹介図の正本 | 独立宣言なし。assets README | 維持担当、SVG作成履歴 | 未宣言 | 作者・配布宣言の意図を確認 |
| `assets/readme/learning-map.png` | SVGのChromium描画 | 独立宣言なし。assets README | 維持担当、元SVGと描画記録 | 未宣言 | 元SVGの宣言確認後に派生物を照合 |
| `assets/readme/site-overview.png` | 公開サイトの実画面 | 独立宣言なし。assets README | 維持担当、公開ページと第三者UI/フォントの宣言 | 未宣言 | 画面に含む文章・UIとスクリーンショットの配布条件を確認 |
| `assets/readme/dependency-map.png` | 公開依存マップの実画面 | 独立宣言なし。assets README | 維持担当、roadmapページと第三者UIの宣言 | 未宣言 | 図・UIを含む画面の配布条件を確認 |
| `assets/readme/audio-learning.png` | 公開音声一覧を停止状態で撮影 | 独立宣言なし。assets README | 維持担当、audioページ・credit・第三者UIの宣言 | 未宣言 | 画面の条件と音声自体の条件を分けて確認 |
| `assets/readme/site-search.png` | 公開サイトの検索実画面 | 独立宣言なし。assets README | 維持担当、検索ページ・第三者UIの宣言 | 未宣言 | 検索結果文章とUIを含む画面の配布条件を確認 |

## カタログ参照MP3の全件

各行のRelease URL、原文パス、episode ID、credit、声別規約は固定HEADのcatalogから転記しています。全9episodesに`VOICEVOX Nemo（女声1・男声1）`と[声の利用規約](https://voicevox.hiroshiba.jp/nemo/term/)が記録されています。同規約は2026-10-03に一次ページを読み取り確認しました。台本の原文・編集来歴は別証拠であり、MP3全体の新しい配布宣言は行いません。

| MP3 / Release | 原文・episode / part | 既存credit・声規約 |
| --- | --- | --- |
| [00-overview--learning-roadmap-70c1702d98bf-80cbd75bddd0-5e46e5712e06-p01-5e46e5712e06af3e.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-learning-roadmap-70c1702d98bf2717-80cbd75bddd0b4c3/00-overview--learning-roadmap-70c1702d98bf-80cbd75bddd0-5e46e5712e06-p01-5e46e5712e06af3e.mp3) | [docs/00-overview/learning-roadmap.md](../../../docs/00-overview/learning-roadmap.md) / 00-overview--learning-roadmap-70c1702d98bf-80cbd75bddd0-5e46e5712e06-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |
| [00-overview--research-literacy-fad6f5ae3b58-beeb534a8845-4bc9266fdaa2-p01-4bc9266fdaa2cb17.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-research-literacy-fad6f5ae3b581157-beeb534a884589b1/00-overview--research-literacy-fad6f5ae3b58-beeb534a8845-4bc9266fdaa2-p01-4bc9266fdaa2cb17.mp3) | [docs/00-overview/research-literacy.md](../../../docs/00-overview/research-literacy.md) / 00-overview--research-literacy-fad6f5ae3b58-beeb534a8845-4bc9266fdaa2-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |
| [00-overview--skill-map-3f928eb4ba8c-7213b633277c-cf5cf8c2b5d3-p01-cf5cf8c2b5d3cca7.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-skill-map-3f928eb4ba8caf80-7213b633277c1bdb/00-overview--skill-map-3f928eb4ba8c-7213b633277c-cf5cf8c2b5d3-p01-cf5cf8c2b5d3cca7.mp3) | [docs/00-overview/skill-map.md](../../../docs/00-overview/skill-map.md) / 00-overview--skill-map-3f928eb4ba8c-7213b633277c-cf5cf8c2b5d3-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |
| [01-concepts--agent-loop-3c6f324e5d0d-7ab8a0e6323a-47803c3cb76f-p01-47803c3cb76f5e73.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-agent-loop-3c6f324e5d0d4a60-7ab8a0e6323a20e7/01-concepts--agent-loop-3c6f324e5d0d-7ab8a0e6323a-47803c3cb76f-p01-47803c3cb76f5e73.mp3) | [docs/01-concepts/agent-loop.md](../../../docs/01-concepts/agent-loop.md) / 01-concepts--agent-loop-3c6f324e5d0d-7ab8a0e6323a-47803c3cb76f-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |
| [01-concepts--ai-history-and-lineage-508240fb9ce2-1fa9339ce58d-eba5f2a0f215-p01-eba5f2a0f215582c.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-ai-history-and-lineage-508240fb9ce27f55-1fa9339ce58da1f4/01-concepts--ai-history-and-lineage-508240fb9ce2-1fa9339ce58d-eba5f2a0f215-p01-eba5f2a0f215582c.mp3) | [docs/01-concepts/ai-history-and-lineage.md](../../../docs/01-concepts/ai-history-and-lineage.md) / 01-concepts--ai-history-and-lineage-508240fb9ce2-1fa9339ce58d-eba5f2a0f215-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |
| [01-concepts--computer-use-and-multimodal-agents-72b2d739835c-dfdd62fa182b-a4c135d05beb-p01-a4c135d05bebd170.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-computer-use-and-multimodal-agents-72b2d739835c08a1-dfdd62fa182b4e96/01-concepts--computer-use-and-multimodal-agents-72b2d739835c-dfdd62fa182b-a4c135d05beb-p01-a4c135d05bebd170.mp3) | [docs/01-concepts/computer-use-and-multimodal-agents.md](../../../docs/01-concepts/computer-use-and-multimodal-agents.md) / 01-concepts--computer-use-and-multimodal-agents-72b2d739835c-dfdd62fa182b-a4c135d05beb-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |
| [01-concepts--memory-and-state-b17d73317aee-d19b0b1cb91a-d83c237b01da-p01-d83c237b01da6bb3.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-memory-and-state-b17d73317aeea3a7-d19b0b1cb91a9aa8/01-concepts--memory-and-state-b17d73317aee-d19b0b1cb91a-d83c237b01da-p01-d83c237b01da6bb3.mp3) | [docs/01-concepts/memory-and-state.md](../../../docs/01-concepts/memory-and-state.md) / 01-concepts--memory-and-state-b17d73317aee-d19b0b1cb91a-d83c237b01da-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |
| [01-concepts--physical-ai-overview-c35ef6ae1842-88b372e9e194-92ddaf0d718e-p01-92ddaf0d718ed0d1.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-physical-ai-overview-c35ef6ae18429a44-88b372e9e19476c9/01-concepts--physical-ai-overview-c35ef6ae1842-88b372e9e194-92ddaf0d718e-p01-92ddaf0d718ed0d1.mp3) | [docs/01-concepts/physical-ai-overview.md](../../../docs/01-concepts/physical-ai-overview.md) / 01-concepts--physical-ai-overview-c35ef6ae1842-88b372e9e194-92ddaf0d718e-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |
| [01-concepts--planning-and-reasoning-bf99366e9f72-4bf01c1ff6dd-c9ea13fdf2bb-p01-c9ea13fdf2bb66b2.mp3](https://github.com/pero3dev/ai-agent-library/releases/download/audio-planning-and-reasoning-bf99366e9f722e65-4bf01c1ff6dd8666/01-concepts--planning-and-reasoning-bf99366e9f72-4bf01c1ff6dd-c9ea13fdf2bb-p01-c9ea13fdf2bb66b2.mp3) | [docs/01-concepts/planning-and-reasoning.md](../../../docs/01-concepts/planning-and-reasoning.md) / 01-concepts--planning-and-reasoning-bf99366e9f72-4bf01c1ff6dd-c9ea13fdf2bb-p01 / 1/1 | VOICEVOX Nemo（女声1・男声1）; [女声1](https://voicevox.hiroshiba.jp/nemo/term/) / [男声1](https://voicevox.hiroshiba.jp/nemo/term/) |

全行の分類は「MP3独立配布宣言未確認」、未確定理由は「カタログはcreditと合成音声規約を示すが、MP3と台本の配布ライセンスを指定しない」です。確認先はリポジトリ維持担当、Release制作時の台本/authorship記録、各声の規約です。空欄を推定で埋めません。

## 検証と限界

追跡画像8件・favicon1件とcatalog全9件の参照を照合し、元記事が存在すること、Release URL/credit/声別license_urlが全行で記載されることを確認します。MP3の取得・内容検査・権利証明、未公開制作物の調査は行いません。台帳の網羅性と確認先は別担当が精読し、root `npm run check`でリンク・Markdown・配置を確認します。採択が必要なライセンス変更はこのIssueの終了条件に含めません。
