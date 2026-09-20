# README の紹介画像

ルート [README](../../README.md) と GitHub の social preview に使う素材です。制作・取得日: 2026-09-20。公開先と検証は[作業記録](../../project/records/2026-09-20/github-showcase.md)を参照してください。

## 素材と正本

| ファイル | 内容・由来 |
| --- | --- |
| [hero.png](hero.png) | 内蔵 imagegen で制作した表紙。1280 × 640、987,029 bytes |
| [social-preview.png](social-preview.png) | hero と同じ画像。GitHub Settings の Social preview へのアップロード用 |
| [learning-map.svg](learning-map.svg) | 16 章を 4 領域で案内する編集可能な正本。1200 × 800。読み順や依存関係を定義する図ではない |
| [learning-map.png](learning-map.png) | SVG の Chromium 描画。SVG 非対応の閲覧環境向け |
| [site-overview.png](site-overview.png) | [公開サイト](https://pero3dev.github.io/ai-agent-library/)の実画面 |
| [dependency-map.png](dependency-map.png) | [依存マップ](https://pero3dev.github.io/ai-agent-library/roadmap/)の実画面、全体を撮影 |
| [audio-learning.png](audio-learning.png) | [音声学習](https://pero3dev.github.io/ai-agent-library/audio/)の実画面。公開済みに絞り、最初の音声を選択して一時停止 |
| [site-search.png](site-search.png) | 公開サイトで「ガードレール」を検索した実画面 |

サイト画像は Codex 内ブラウザーで撮影した PNG です。画面の合成や機能の追加描画はしていません。撮影時点の音声公開数は 9 / 199 記事です。最新数はサイトを確認してください。

## 更新時の確認

- 記事数は `docs/` の published 記事を索引と分けて数える。README と GitHub の About を同期する。
- 章の追加・名称変更時は SVG とルート README の索引を同期し、PNG を再描画する。
- スクリーンショットは公開サイトを再撮影し、撮影日を更新する。個人情報や開発用の表示を含めない。
- 表紙と共有画像の文字・配色は揃え、縮小表示でもタイトルと日本語が読めることを確認する。
- 共有画像は PNG / JPG / GIF、1 MB 未満。[GitHub の推奨](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)は 1280 × 640。Settings → General → Social preview → Edit → Upload an image で設定する。
- CI バッジは実ワークフローを参照する。画面やバッジだけを根拠に、実 API・全記事・実機検証が完了したと表現しない。

## 表紙の生成プロンプト

内蔵 imagegen を使用。有料 API や CLI の画像生成は使用していません。生成された 1774 × 887 の原画像を、構図を変えず Sharp で 1280 × 640 の PNG に縮小・圧縮しています。

```text
Create a finished, premium editorial cover / GitHub repository hero image for a Japanese engineering knowledge library. Asset type: wide 2:1 banner, ideally 1280 x 640 pixels. This is a restrained technical book cover, not a website mockup. Full bleed deep midnight navy background (#0b1625) with an elegant precise geometric illustration on the right: a luminous teal network of interconnected small chapter cards and branching paths, suggesting organized knowledge, engineering architecture and a library. Fine cyan/teal lines, generous negative space, subtle paper-like depth, no robots, no brains, no photographs, no stock icons, no neon overload. Left 65 percent has beautifully set clean readable typography. Exact main title split over two lines if needed: "AI Agent" and "Library". Main title large warm white. Exact Japanese subtitle below: "理解から、設計・実装・運用まで。". Small uppercase eyebrow above main title: "A PRACTICAL GUIDE IN JAPANESE". Small understated bottom line: "CONCEPTS  /  ARCHITECTURE  /  IMPLEMENTATION  /  OPERATIONS". Keep all text fully inside canvas with generous safe margins at least 70 pixels. Typography meticulously aligned. No other text, no article counts, no badges, no logos or watermarks. Overall mature, beautiful, calm, crisp technical publication design with clear visual hierarchy. Use teal accent around the eyebrow and small cyan node detail. The banner must look excellent scaled to 800px wide on a GitHub README and serve as a social preview.
```
