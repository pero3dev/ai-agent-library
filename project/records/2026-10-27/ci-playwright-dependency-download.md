# Playwright の Linux 依存取得を制限する CI 候補

2026-10-27 時点の私有v2候補で、通常 CI の `build` job における APT の長時間転送へ対処する。既存の30分上限・全ブラウザー検査を維持し、取得段階だけの制限と公式 mirror への1回の fallback を加える。通常の別PRを予定しており、mainへは未反映である。

## 作業契約

- 目的: f28 の APT 取得遅延へ対処する候補を準備し、取消原因の推定、純試験、実 Hosted 実行を分けて記録する。
- 許可根拠: iOS TODO の自律実装と通常の commit・main merge を進める依頼に付随する CI 改善。親が外部操作と統合を担当し、担当 worker は私有候補と純試験に限定する。
- 技術の所有: `.github/workflows/ci.yml` の `build` job、新規 `.github/scripts/prepare-playwright-linux-deps.mjs`、新規 `tests/unit/ci-playwright-linux-deps.test.mjs` の3 path。
- 記録の所有: この Markdown・同名 JSON・`project/README.md` の新記録リンク1段落。実 main `20f2024a107e75c0c4775e58a1223ad1c3950c05` の bytes を `git show` で読み、共有未保存差分は複製しない。
- 変更範囲: `build` job の Ubuntu 24.04 固定、依存の一括取得・インストール、browser binary の一括インストール。既存の required check 名・他job・Node設定・テスト45秒・2 workers・retryなし・job30分は維持する。アプリ版・TODO・iOS sourceは変更しない。
- 必要な検証・終了条件: 純 Node 試験、依存表の実 bytes 確認、baseとの差分限定、凍結hashに対する独立レビューを揃える。候補準備の完了と Hosted 上の有効性・採用・main反映を区別し、後者のhead/runを空のまま残す。
- 適用: [共通契約](../../../AGENTS.md)、[CI・ハーネスの検証](../../../CONTRIBUTING.md)、[Git共通規約](../../../harness/git-rules.md)、[索引](../../README.md)。

## 実 f28 の観測

読取監査の対象は head `f28c22e0e89c6e4d4cf76e295cd030d2535e454c` の [run 40340824254 / build job 121634732747](https://github.com/pero3dev/ai-agent-library/actions/runs/40340824254/job/121634732747) で、API の conclusion は `cancelled` だった。job開始からブラウザー中断まで約30分15秒は30分上限と整合するが、読取APIとログだけでは手動・concurrency等の取消と区別できず、取消原因を断定しない。

Chromium 側は24.5MBのAPT転送に11分3秒、Firefox側は22.3MBに10分56秒を使い、APT転送だけで約21分59秒だった。browser ZIP は合計9秒未満、npm cacheはhit、静的ビルドは約55秒で成功した。682ブラウザーケースの途中に331 pass・failure行0を観測したが、最終summaryはなく全検査成功ではない。Firefoxの見た目検査も未開始だった。

遅い転送の参照先は Azure の Ubuntu noble/noble-updates で、IPv6やDNS障害の根拠はなかった。`ForceIPv4`、browser cache、実行予算延長、assert削減、paid runnerへの変更は加えない。

## 候補の契約

[準備script](../../../.github/scripts/prepare-playwright-linux-deps.mjs) は、公開repo `pero3dev/ai-agent-library` の標準 Hosted Linux x64 CI・所有workspace・Ubuntu 24.04 nobleだけを受理する。lockと導入済み Playwright の5版照合を1.63.0へ固定し、bundle中の `ubuntu24.04-x64` の tools/chromium/firefox 配列をJSONデータとして厳密に読む。bundleを評価せず、package名の許可文字・配列の一意性・全groupの存在を検査し、重複を除いた全依存を使う。実データでは43packageだった。1.63.0のLinux `--dry-run` は不足一覧だけを返すため、その出力から全packageを作らない。将来の版更新には手動レビューが必要である。

APT metadata は60秒、download-only は180秒をroot側GNU timeoutで制限し、TERMの後に5秒のKILL猶予を持つ。最初の取得失敗に限って公式mirrorへ1回fallbackする。metadataの部分失敗を成功にしない `APT::Update::Error-Mode=any` と、取得の再試行0を使う。外側の中断はsudoへ伝達してchild closeを待ち、中断後はfallbackやインストールを開始しない。実sudoのsignal relay・PTY挙動は純試験で確認した扱いにしない。

mirror fixtureの根拠は、親が読取確認した公式 [runner-images の configure-apt-sources.sh](https://github.com/actions/runner-images/blob/c74a28e5f8943ae6a39cac7c3701dd6bd0a2ea51/images/ubuntu/scripts/build/configure-apt-sources.sh)（blob `b3f5b2b180df8eb39fcbba034f616e03a69e775c`）である。Azure HTTP priority:1・archive HTTPS priority:2・security HTTPS priority:3の3行を、末尾slash・区切りTAB・LFまで厳密に受理する。fallbackはAzure行だけを外し、既存archive/security行のbytesと順序を保つ。sources・suite・component・Signed-By・GPG/checksum検証は変更しない。同じmirrorfileをnoble-securityが参照してもsource自体は不変とする。

実runner上のmirror/source実bytesは未取得である。未知のOS・mirror・source format・URI・署名を弱める設定・symlinkはsudo前に拒否し、その拒否を成功扱いにしない。ログはsource本文・任意URLを出さず、path・hash・mode・size等の上限付き概要を保存する。各APT操作前にsource一覧・内容・identityと、その時点のmirrorを再照合する。

元mirrorのbytes・mode・realpath・identityを保存し、固定root writerが `O_NOFOLLOW` とinode/mode/内容比較を使って書き込む。書込例外は同じfdで巻き戻し、取得のfinallyで元mirrorの厳密復元を確認してから、`--no-download` の実インストールを1回だけ実行する。このインストールには独自のtimeout・abort kill・retryを加えない。browser binary は Chromium とFirefoxを `--with-deps` なしで1回にまとめる。

## 検証と凍結

[純試験](../../../tests/unit/ci-playwright-linux-deps.test.mjs) 78ケースがv2の既存Node v24.19.0で成功し、失敗0だった。v1ではNode v24.19.0とv18.13.0でそれぞれ78ケースが成功しているが、この旧結果は履歴とし、v2の再検証へ流用しない。v2は公開記録検査へ合わせ、純試験の合成workspace ROOT literalだけを非profileパスへ置き換えた。実装・workflowのbytesはv1と同一である。v24.19.0はrepo enginesに適合し、CIのNode22でのローカル確認は未実施である。fake FS・fake childで、未知入力の拒否、全依存union、取得のtimeout引数、fallback1回、復元、中断、`--no-download`・dpkg再試行なし、sudoへ渡る最終引数列、入力identity・出力上限を検査した。root Python writer本文は静的確認と読み取りレビューで、実行していない。

baseとf28の `ci.yml` は同一bytesで、候補との差分は `build` job内だけ、job上限は30分のままと確認した。v1の独立した読み取り専用reviewerは旧3hashを照合して承認し、blocking指摘0だった。これは旧freezeの履歴である。下記はROOT literalだけを直したv2の3hashで、親が最終6 pathの独立レビューを取り直すまでv2承認とは扱わない。旧reviewerも実APT・root writer・sudo relay・Hosted効果は検証していない。

| 凍結対象 | SHA-256 |
| --- | --- |
| `.github/workflows/ci.yml` | `c8917c99189bb25b459edbfd799d50fd4b6d4693212a12b0ff0820483a88a881` |
| `.github/scripts/prepare-playwright-linux-deps.mjs` | `b58f6ce6ae28190b487146b7b7bbc1a7e14b974f966090d728b9b3c27fbdab4d` |
| `tests/unit/ci-playwright-linux-deps.test.mjs` | `33d06da00ab18fac8ce94b6f3aa13dea7c150c89cc4ec9f0df19f58ef0ad43d5` |

私有の取消監査、technical proof・manifest・workflow diffを保持する。manifestのSHA-256は `ce37f5b9abd6a861c34776e7eab343d1e07f404c402704437848c4519422388f` で、この記録のJSONにも検証面を分ける。

## 未実施と次の操作

実APT・sudo・root writer・Linux signal relay、変更後のHosted CI、全browser assertions、転送改善の実測は未実施である。依存導入、`npm ci`・`npm run check`、実Playwright CLI・browser・SDK/Simulatorもこの担当範囲では実行していない。Git/APIの更新と共有sourceの編集も行っていない。

親が6 pathの最終内容・独立レビューを揃えて通常の別PRへ提出し、正確なheadに対応する1回のCIで、source/mirror guardの実通過と全検査を確認してから採否を判断する。future head/run/PR/mergeは未確定で、main反映やCI改善成功とは記録しない。実機skipの許可を、必要なCIやAPT動作確認の省略根拠には使わない。
