# D2 native 200% zoom の限定診断証拠

2026-09-30の機構probeとcapture診断を原byteで保存した。これは**1図の1段階を対象としたローカル診断**であり、全段階・記事・公開版・200%表示全体の受入ではない。実行環境は隔離persistent profileのbundled Chromium 153.0.8010.12 / Playwright 1.63.0で、ユーザーの通常profile・設定には触れていない。

[相対索引とSHA](index.json)、[実視認の出所付き台帳](viewed-ledger.json)から原本をたどれる。原runのpassed-bounded-probe-onlyは機構検査の結果としてそのまま保存し、画像・製品承認への読み替えをしない。保存作業でブラウザーは再実行していない。

## 確認できたこと

[初回原結果](raw/initial/result.json)は、公式の[Chrome tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs)によるautomatic / per-tabのsetZoom/getZoom 1→2→1を観測した。inner viewportは1424×905→712×452→1424×905、DPRは1→2→1、visualViewport.scaleは常に1だった。CSS zoom/transform、deviceScaleFactor、PageScaleFactorで代用せず、HTML・input・BUILD・lock・helper hashの前後一致を記録した。

初回の200% Playwright viewportは白く、fullSceneと名付けた画像は本文/表を誤って切り出していた。この命名とrawを保存するが、正しいscene画像と扱わない。[root初回実視認](raw/viewed/reasoning-native-zoom-initial-viewed.json)に失敗の境界を残した。

[2回目原結果](raw/capture/result.json)は、同じnative200・manual S2・scrollY1801.5で、CDP Page.captureScreenshot（fromSurface:true、captureBeyondViewport:false、clipなし）→Playwright viewport→CDPの順に取得した。前後のCDP画像は1424×905でbyte一致し、図が描画されている。間のPlaywright画像は712×452で白い。[このCDP実画像](raw/capture/images/zoom-200-cdp-before-playwright.png)と[白いPlaywright画像](raw/capture/images/zoom-200-playwright-viewport.png)が対応する。100%復帰時はCDP/Playwrightの3画像hashがすべて一致した。

この結果は取得経路の差を示し、白画像だけから製品未描画と判断できない。**正確なPlaywright/Chromium内部原因は未確定**。CDPの画像には低い有効viewportの固定headerがscene上部を覆う箇所があり、centerへscrollした1枚で全図可読性を受け入れない。全段階、別engine、native200全体の受入や修正は未実施である。

## 原本・実視認・省略物

原本30ファイルを保存した。両runのresult JSON、before/after配信HTML4本（gzip）、生成PNG12枚すべて、[作者診断MD](raw/capture/visual-diagnosis.md) / [JSONと元実視認記録](raw/capture/visual-diagnosis.json)、probe helper2本、実行前source review2本、root実視認ledger2本、最小MV3拡張のmanifest/background各2本を含む。HTMLは展開hashと元hashを照合し、他の原本は無変換である。

生成12画像に対し、元ledgerが明示する実視認はroot4 paths、作者6 paths、重複3 paths、union7 pathsで、未視認5 pathsも全て保存した。同じbyteの画像が複数あっても、そのpathを見たと推定しない。全画像の固有hashは6、実視認pathが持つ固有hashは5。元raw内のactuallyViewed:falseは実行時のまま残し、後からの視認は元ledgerと相対台帳で結ぶ。

コピーしないものは両runのisolated-profile全体（cache、cookiesなどを含む）である。生成画像の省略は0、取得漏れは0。ネットワークHEAD/GET fetchのERR_ABORTEDは原rawに保持し、critical-resource/page/console失敗0と区別する。fetch中断の内部原因を確定した記録ではない。

## 別PCでの扱い

raw内の絶対パスとTEMP参照は履歴であり、実行先ではない。indexのstored/source bindingsとviewed-ledgerはこのディレクトリを基準に読む。[初回helper](raw/helpers/reasoning-native-zoom-probe.mjs) / [capture helper](raw/helpers/reasoning-native-zoom-capture-probe.mjs)は当時の再現用ソースで、archive内から直接実行しない。再利用する場合は対象の実BUILD/HTML/input・一意の隔離profile・local URL・依存を確認し、変更したhelperの独立レビューと実行指示を得る。今回のOS profileやcookieは復元しない。

[初回source review](raw/reviews/reasoning-native-zoom-probe-source-review.json) / [capture source review](raw/reviews/reasoning-native-zoom-capture-probe-source-review.json)は当時のhelper hashにだけ結び付く。[rootのCDP実視認](raw/viewed/reasoning-native-zoom-capture-root-viewed.json)と作者診断も独立した出所として保持する。全段階・記事・公開の受入へ拡張しない。
