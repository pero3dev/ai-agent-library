# PR62 公開修正版の独立レビュー

**approved / low、must 0・should 0。PUBLIC-V1は実際の公開修正版で解消。C2と既存7記事、計8記事を下記範囲で合成受入する。**

対象merge `5940334a6fd3aab8178cfeb8746a58c8b937d390`、main CI 36615994124、build job109569009080、Pages job109574494236、公開BUILD `FnChqMe5DEINmNrKQkZeM`。

## 修正の実確認

公開Edge/WebKit全91ずつ成功。別のfocused公開実行も各16、計32観測成功。6桁と負号を残し、logit18/draw22を確認。実画像でCの0.000000とDの-1.000000の連結が消え、2行のA/B選択・棒・数値を読み分けられる。最小余白はWebKit 14.171875、Edge 24.091675 SVG単位。

**新公開画像の実視認47枚**：focused36（全32scene＋viewport4）、current Edge full91代表11（C2各5図＋他6記事）。Edge29・WebKit18、図全体38・viewport9。総生成はfull1339＋focused64＝1403。旧公開90やlocal画像、rootの追加視認をこの47へ加算していない。

通常6profile（1440明暗、1280×720明、390明暗、960×540 DSF2明）と拡大2profile（1440明、390暗）でdraw/logit双方を実確認。低画面viewport2枚では操作後のscroll位置で上部が画面外だが、別の無加工full-sceneを実視認。390幅の数値は約9.84〜10.01CSSpxという小ささを残す。PC中心の今回の間隔修正として承認し、モバイル文字全般の改善とは扱わない。

## 配信とソースの同一性

actual mergeのGit blobから8記事のAST・assignment・registry・入力ファイルを再構成し、凍結localの8inputDigestと一致。他7はPR61のinputDigestと不変。collectorのdownload/artifact.tarをSHA256検証し、8HTMLと72assetをCI tarから直接照合。両focused実行の前後に公開8HTML/BUILD＋72assetをHTTP再取得し一致。browser実応答もCI artifact hashへ照合した。ローカルoutを公開期待値へ転用していない。

focused実browser検証はEdge235応答/50unique、WebKit222応答/37unique。critical network errorは双方0。Edgeの66 ERR_ABORTEDは全てCI内に実在するページfetch（navigation61・modal5）、時刻/type/URL/contextClosing=falseを保存。図解script/style/font等や未知resourceは除外していない。WebKit requestfailed0。全91側のraw失敗はEdge7件、WebKit0件で、noJSのexpectedBlockedScriptsと全件同一。通常console/pageerror0。

## C2・他の記事を含む受入の根拠

PR61の独立reviewはC2全23段階、条件・選択肢・READ/noJS/print・低いPC/狭幅、旧7記事代表と51bbox候補を実画像確認し、唯一PUBLIC-V1をmustとしていた。この原判定は書換えず保存した。今回は他7入力不変、現公開全91×2と新公開代表11枚を重ね、その確認範囲を持ち越す。全ての旧図を再視認したとは主張しない。

Edgeの49候補/20記録は原候補と0.001SVG単位丸めで同じ、新/変更候補0。元の実視認画像hash・判定へ対応付けた。WebKitは原2候補から現0となり、新focused32sceneで間隔を直接確認した。推論の修正箇所以外は、原review＋凍結localのCSS1行差分証明＋現公開全91で範囲を限定して受け入れる。

## 検証器の修正と留保

初回の両focused起動はTEMP helperが正規Nextルートの[[...mdxPath]]まで拒否し、browser起動前に停止。原helper・失敗logを保存し、拒否条件を「..というpath区間」へ限定した。通常/dynamicroute受理、../中間../両区切り、絶対/UNC拒否のoffline11項目成功。数値・幾何・画像capture関数は凍結localと同一。新時刻の再実行で上記32観測を得た。製品や全91の失敗ではない。

物理iPhone/Safari、実スクリーンリーダー、物理印刷、新性能/CLS計測は未実施。rawのvisual pending欄は変更せず、この別ファイルが独立判定を与える。製品・kit・repo・Gitは編集していない。

## 証拠ファイル

- 完全JSON: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-public-pr62-review.json
- 新実視認台帳: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-public-pr62-viewed-images.json
- focused Edge: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-public-pr62-fixed\chromium-2026-09-29T19-36-41.640Z\result.json
- focused WebKit: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-public-pr62-fixed\webkit-2026-09-29T19-36-54.572Z\result.json
- 8input/8HTML/72asset、全91結果、bbox比較、helper修正とrawログの絶対path/sha256は完全JSONに保存。
