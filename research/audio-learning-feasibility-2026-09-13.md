# 音声学習機能の実現性調査

確認日: 2026-09-13(JST)。調査中のローカル時計を `2026-09-13T02:02:41.0193912+09:00` に確認しました。各資料の秒単位の取得時刻は保存していません。

目的は AI Agent Library に耳で学習する機能を追加できるかの判断です。[要件対話と作業契約](../project/plans/engineering/audio-learning.md)に接続し、要件に応じた候補比較を追加しています。採用決定、実 API・実端末の試験ではありません。

## 公式資料で確認した範囲

| 出典 | 確認した主張 | この検討への意味・制約 |
| --- | --- | --- |
| [Google: Gemini API の音声生成](https://ai.google.dev/gemini-api/docs/speech-generation) | テキストからの単一話者・複数話者音声、日本語対応、スタイル・速度等の指示、台本生成と音声化の分離が案内されています。複数話者の説明は最大 2 人。TTS は Preview 表記です | 講義・対話を音声化する技術的な選択肢がある根拠です。日本語品質、正確な台本再現、長尺の安定性、価格、利用条件の採用評価は未実施です |
| [Google: Media Session とプレイリスト](https://developer.chrome.com/blog/media-session) | HTML の audio 要素での再生、通知・ロック画面に表示する情報や再生操作、プレイリスト連携の例があります | Web プレイヤーを実装する根拠です。Chrome の説明を iPhone/Safari の動作保証として扱いません。端末・OS・ブラウザーごとの実機受入が必要です |
| [Apple: Podcast RSS feed requirements](https://podcasters.apple.com/support/823-podcast-requirements) | RSS を自身で生成・配信できます。Apple への提出用フィードには公開アクセス、エピソード、アートワーク、enclosure、固定 GUID 等が必要です。ホストは HEAD と byte-range を扱う必要があります | 外部ポッドキャスト配信も候補にできます。サイト内再生とは別の要件です。非公開利用にそのまま流用できると判断せず、公開範囲を先に確認します |
| [WebKit: Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/) | ブラウザーのサイトデータには保存容量や自動削除の条件があり、既定の保持は保証されません | 再生位置などの端末内保存にも保持条件があります。オフライン音声は Q13 で不要となりましたが、端末内保存を永久保存や端末間同期として扱わない根拠です |

iPhone の再生に関しては、WebKit の [Safari 16.3 の修正履歴](https://webkit.org/blog/13691/webkit-features-in-safari-16-3/)と [iOS 16/17 の standalone web app の報告](https://bugs.webkit.org/show_bug.cgi?format=multiple&id=261858)にも、Media Session や通常の Safari とホーム画面追加時の違いが記録されています。過去の版の履歴をユーザー端末での現行不具合と断定しません。ロック中の継続・次の回への移行・割込み後の復帰を、対象 OS・ブラウザー・利用形態で試す必要があるという受入設計の根拠に限定します。追加資料も 2026-09-13 に確認しました。

資料中のサンプルコードは実行していません。Google のページは説明とコード例でモデル世代や API の記述が揃わない箇所があるため、ここでは音声化能力の存在確認に限定し、モデルや実装コードを採用していません。

上表の外部ポッドキャスト配信は初期の比較対象でした。Q10・Q11 で一般公開・サイト内再生を選んだため、RSS 配信先への登録は現行要件に含めません。

## 無料優先・自動制作への追加調査

Q18〜21 で「追加費用をかけないことを優先」「制作から公開まで自動化」「既存契約は Claude Pro」「Windows PC で生成可能」を確認したため、2026-09-13 に以下を追加調査しました。契約枠・PC 性能・音声品質・配信容量まで含めた無追加費用の運用成立は、まだ検証していません。

| 工程・候補 | 公式資料で確認した範囲 | 採用前に残る確認 |
| --- | --- | --- |
| Claude Code で台本を作る | [Pro/Max の案内](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)では Pro から Claude Code を利用でき、Claude と使用枠を共有します。API 課金とは別です。[プログラムからの実行](https://code.claude.com/docs/en/headless)に非対話実行が案内されています | 長尺台本の制作・独立した内容確認に使う量、普段の利用との競合、上限に達した際の待機と再開。認証状態・契約残量は未確認です |
| VOICEVOX ENGINE | [公式サイト](https://voicevox.hiroshiba.jp/)では商用・非商用の無料利用、Windows 対応が案内され、[ENGINE](https://github.com/VOICEVOX/voicevox_engine)は HTTP API と CPU/GPU の実行方法を提供しています | 対話台本の発話ごとに話者を指定して合成・結合する構成が候補です。日本語技術用語の発音、対話の自然さ、処理時間、声の選定は未試験です |
| VOICEVOX Nemo | [公式紹介](https://voicevox.hiroshiba.jp/nemo/)はキャラクターを持たない複数の声、無料利用、Windows 対応を案内しています | 公開する音声に適用する音声ライブラリの条件、必要な表記、使用する配布物と ENGINE の連携を確認します。[ソフトウェア規約](https://voicevox.hiroshiba.jp/term/)はクレジットと各音声ライブラリの規約への従属を求めています |
| Kokoro | [公式モデルカード](https://huggingface.co/hexgrad/Kokoro-82M)は Apache-2.0 の重みとローカル実行例を案内し、[音声一覧](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)に日本語の複数話者があります | 音声一覧は非英語・短すぎる発話・長すぎる発話の品質上の制約も説明しています。Windows 依存構成と技術用語の品質を未検証です。予備候補に留めます |
| 現行 GitHub Pages | [公式上限](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)は公開サイト 1 GB、帯域は月 100 GB の soft limit です | 音声全体と通常サイトの容量、聴取数、更新時の旧版保持を見積もります。長尺音声を全記事へ拡張する場合、現在のサイトと同じ場所だけに収められるとは判断しません |

構成候補は「PC 上で既存契約を使って台本作成・内容確認 → ローカル音声合成 → 自動検査 → 公開配信先へ配置 → サイトは配信済み音声を再生」です。PC の稼働は制作時だけ必要にし、通勤中の再生は PC の起動に依存させない設計を想定します。これは採択前の案です。

追加課金を避ける実装では、Claude Code の契約認証と API 認証・追加 usage credits を区別し、上限到達時に課金経路へ自動で切り替えないことが必要です。公式の非対話実行資料にある `--bare` は契約ログインを使わないため、その例を無料運用へそのまま適用しません。契約認証の非対話実行と再開は将来の実証対象です。

「無料」はソフトウェア・サービスへの追加支払いを抑えるという要件として扱い、PC の処理負荷・電力・既存契約の使用枠・保管容量が無制限という意味ではありません。今回、インストール、モデル取得、台本・音声生成、設定変更、公開操作は行っていません。

### 全記事を対象にした容量の見通し

2026-09-13 に `docs/` の published 指定を数え、199 記事を確認しました。**全記事が同じ長さになるという予測ではなく、配信方式を検討するための仮定計算**です。

| 仮定 | 合計時間 | 64 kbps の音声容量(10 進 GB) |
| --- | --- | --- |
| 199 記事 × 30 分 | 99.5 時間 | 約 2.866 GB |
| 199 記事 × 60 分 | 199 時間 | 約 5.731 GB |

式は `記事数 × 分数 × 60 × 64000 ÷ 8 ÷ 1000000000` です。台本・索引・元のサイト・旧版・コンテナの付加情報・分割や圧縮効率は含めません。64 kbps は比較用の仮定で、音質設定として採択した値ではありません。現在の GitHub Pages のサイト 1 GB 上限には収まらない規模のため、音声本体の別配信を検討します。

- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases): 1 release あたり最大 1,000 assets、1 file は 2 GiB 未満、release の総量と帯域には上限を設けないという公式説明です。この教材プロジェクトの版に対応する音声成果物の配布候補です。一般的な音声 CDN と同じ動作保証があるという意味ではなく、利用目的の適合・iPhone からの再生・シーク・redirect の扱いは別途確認します。
- [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/): Standard の無料枠は月 10 GB-month、Class A 100 万 requests、Class B 1,000 万 requests、外向き転送は無料です。無料枠を超える保管・操作は従量課金なので「永久に無条件で無料」の候補ではありません。登録条件、公開 URL、本番配信、超過の扱いは後続の追加確認に記します。

### 配信先の追加確認

2026-09-13 に上記 2 候補を公式資料で追加確認しました。無料優先の条件では **GitHub Releases を先に実証する候補、R2 を条件付きの代替候補**とする判断です。採用決定・実配信の確認ではありません。

- GitHub: [Pages の上限説明](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)が超過への対策に Releases を挙げています。[Release assets API](https://docs.github.com/en/rest/releases/assets)はバイナリ取得の 200/302 と `browser_download_url` を説明していますが、添付物の最終配信 URL における Range・CORS・Content-Disposition の保証は今回確認できませんでした。[REST API の CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)を添付物配信に一般化しません。[過剰帯域の規定](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies#9-excessive-bandwidth-use)による制限の可能性もあるため、汎用 CDN の無制限保証として扱いません。
- R2: [公開バケット](https://developers.cloudflare.com/r2/buckets/public-buckets/)・[CORS](https://developers.cloudflare.com/r2/buckets/cors/)・[S3 互換性](https://developers.cloudflare.com/r2/api/s3/api/)が公開配信と部分取得の根拠です。ただし [r2.dev の上限](https://developers.cloudflare.com/r2/platform/limits/)は開発用で、本番では所有するカスタムドメインを使う案内です。[開始手順](https://developers.cloudflare.com/r2/get-started/)では subscription の checkout を経ます。無料枠超過後の課金を絶対に防ぐハード上限の公式根拠は確認できず、単なる予算通知を課金停止として扱いません。新規ドメインが必要なら、その費用も無追加費用の条件に含めて評価します。

GitHub Releases を使う場合も、リポジトリの記事と対応版を持つ音声成果物として配布し、長尺メディア配信に適するかを実証します。公開ダウンロード URL のリダイレクト、最終応答の Content-Type と Range/206、シーク、iPhone のロック中再生・次話への移行が未検証です。

Q23 の結果、代表 2〜3 記事のユーザー試聴承認を量産の前提にする案は採りません。初回から多数の記事を制作しつつ、音声ファイルの配信・再生・自動検査は実装時に確認する方針です。

## 現行リポジトリの静的調査

- 公開サイトは Next.js/Nextra の静的出力を GitHub Pages へ配置する構成です([Next 設定](../website/next.config.mjs)、[CI](../.github/workflows/ci.yml))。事前生成した音声と再生用のクライアントコンポーネントを追加する方式は、この構成と両立すると判断します。
- 記事共通の描画入口は [mdx-components.js](../website/mdx-components.js)、サイト共通の配置入口は [layout.jsx](../website/app/layout.jsx)です。記事ごとのプレイヤーと、ページ遷移をまたぐプレイヤーは配置・状態の設計が異なります。
- 記事正本は `docs/` です。生成された `website/content/` や `website/generated/` を編集せず、記事と音声・台本を結ぶ管理情報の正本と同期方式を設計する必要があります。
- [同期処理](../website/scripts/sync-content.mjs)は記事のタイトル・route 等を収集し、既定で draft を除外します。記事の route に音声情報を対応付けることが候補です。音声自体にも制作・レビュー・公開状態が必要です。
- [MDX ガード](../website/lib/mdx-safety.mjs)は許可していない JSX・生 HTML を拒否するため、記事へ直接 audio タグを足す方法ではなく、共通 React コンポーネント側での実装を検討します。
- 調査したサイトの app・components・lib・scripts・設定ファイルでは、音声プレイヤーや Service Worker、学習状態の永続保存を検出しませんでした。[チェックリスト](../website/components/mdx/checklist-box.jsx)はページ内の状態です。
- [既存ブラウザー試験](../website/playwright.config.mjs)は Chromium が対象です。[ローカル配信ヘルパー](../website/scripts/serve-export.mjs)には音声 MIME・range 要求の処理がなく、音声試験を追加する場合は試験環境側も検討が必要です。
- 音声を閲覧時に生成する方式を採る場合、現行の静的サイトとは別に生成処理・認証・費用制御等の仕組みを検討します。公開 JavaScript に生成サービスの秘密鍵を持たせません。

## 初期判断と未検証事項

追加の教材調査では、[RAG と Agent の関係](../docs/01-concepts/rag-vs-agent.md)、[RAG 実装パターン](../docs/03-implementation/rag-implementation-patterns.md)、[ツール定義の設計](../docs/03-implementation/tool-definition-design.md)、[学習ロードマップ](../docs/00-overview/learning-roadmap.md)を確認しました。以下は当時の提案です。その後、図・コードの言語化は Q8、各回の前提補足は Q28、区切りでの言い直しは Q29 で確定しました。具体的な評価手法・合否基準は要件案の全体確認と技術実証の対象です。

- 元記事に近い深さは、文字量だけでなく、設計判断・条件・例外・失敗例を説明できるかで評価することが候補です。
- 図の代わりに同じ具体例で構成の違いを説明し、コードは名前・用途・入力制約・結果・失敗時の挙動を伝えることが候補です。処理の順序や重要な制約値を省略しない台本が必要です。
- 現行の入門ルートは LLM API の利用経験を前提にし、10 章の LLM 基礎は任意です。ユーザーの現在の知識に合わせ、未説明の AI 用語を前提にしない補足方法を要件として検討します。既存のルート変更やコース制作を採択したわけではありません。
- 聞き手が相づちだけでなく、開発経験に基づく疑問や失敗時の振る舞いを質問し、節の切替と現在の話題を音声で示す構成が候補です。

**初期判断: 事前に作成した音声による学習機能は追加可能です。** これはソースと仕様からの設計上の判断です。現在その機能がある、品質基準を満たす、特定の端末で確実に連続再生できる、という意味ではありません。

- 音声教材の品質: 図・表・コードの言語化、略語や製品名の読み、原文の条件や注意事項を落とさない台本、聞き疲れ、所要時間。
- モバイル利用: 画面ロック、他アプリ使用、次エピソードへの移行、Bluetooth 操作、着信後の復帰、通信断と再接続。
- 状態保存: 同一ブラウザー内の再生位置・リスト保持、保存の失効、復帰挙動。Q13・Q15 で専用のオフライン対応・端末間同期は要求外になりました。
- 配信: 音声形式、ファイル容量、ホスティングの上限と料金、range 応答、キャッシュ、外部配信先。現行ホストの音声配信能力は実測していません。
- 制作と保守: 台本と元記事の版の紐付け、再生成の条件、生成失敗の検出、レビュー負担、公開・取り下げの手順。
- 費用: 追加支払いなしを優先し、初期制作・再生成に使う契約枠、PC の処理時間、保存・配信の無料上限を検討します。対象は全記事と確定しましたが、初回の公開本数・更新頻度・利用者数は未確定です。

ここまでの初期調査では、生成サービスへの記事送信、音声生成、端末再生、配信先への登録・公開を行っていません。実装開始後の観測を次に分けて記録します。

## 実装開始後の確認

確認日: 2026-09-13。要件確定後、ユーザーから実装を依頼されました。

- [VOICEVOX Nemo の利用規約](https://voicevox.hiroshiba.jp/nemo/term/)では、音声の利用にクレジット表記が必要です。本機能は「VOICEVOX Nemo（女声1・男声1）」を表示します。音声を機械学習用途に転用せず、公開した学習番組として再生します。
- [公式エンジンのリリース](https://github.com/VOICEVOX/voicevox_nemo_engine/releases/tag/0.24.0)を GitHub API で取得しました。Windows CPU の VVPP は ZIP 形式で、SHA-256 は `418c515ce567c1426b425bd2fe05eb0a62196bcec223829725e9ed4ff345b437` でした。ダウンロードしたファイルを照合し、実エンジンの `/speakers` で女声1 `10005`、男声1 `10001` を確認しました。
- FFmpeg の [公式ダウンロード案内](https://ffmpeg.org/download.html)に掲載された [Gyan の Windows ビルド](https://www.gyan.dev/ffmpeg/builds/)を利用しました。9.0.1 essentials ZIP の SHA-256 は `fec81ae03971d9dd4be3ebe02e263bd2ec1d789483f931bdba5f5715e65da2e9` です。ツールは git 管理外に展開し、実行ファイルをサイトに配布しません。
- 実エンジンと FFmpeg を接続し、テスト専用の二人の会話を MP3 に合成しました。再生時間 30.773333 秒、チャプター開始は 0 秒と 14.603 秒、無音合計は約 1.095 秒でした。合成、圧縮、デコード、時間・無音検査は成功しました。Claude による教材台本の生成や iPhone 受入の結果ではありません。
- Claude Code 2.1.246 のローカル `--help` で `--safe-mode` を確認しました。プロジェクトのツールやフックを使わずに台本を作る構成です。認証状態は未ログインで、アカウントの Extra usage の無効化も別途確認が必要です。

現行の操作・受入結果は [実装記録](../project/records/2026-09-13/audio-learning-implementation.md)に追記します。
