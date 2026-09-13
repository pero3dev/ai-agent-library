# 音声ブラウザー試験のフィクスチャ

`audio-catalog.json` は `AUDIO_TEST_CATALOG` を指定した隔離ビルドだけで使います。
`tone-60s.mp3` は 220 Hz の小音量サイン波を 60 秒分生成した試験専用 MP3 です。
話者の声や学習コンテンツは含みません。公開カタログや公開サイトには追加しません。

- MPEG-1 Audio Layer III、44.1 kHz、モノラル、64 kbps
- ファイルサイズ: 480,235 bytes
- SHA-256: `1b8d2520511614491fe40ddf90c054d4ed0ff24536a1d1b74835e0fd6cfe3f78`
- エンコーダー: `lamejs@1.2.1`。MP3 のフレーム単位のパディングにより、再生時間は約 60.03 秒です。

`audio.spec.mjs` は隔離ビルドの JavaScript に含まれる試験カタログの GitHub Releases URL だけを、
ローカルのリリース配信サーバーの URL に置き換えます。WebKit のネイティブメディア通信は
Playwright のリクエスト差し替えを通らない場合があるため、実際の HTTP サーバーを使います。
リリース配信サーバーは別ポートのアセット配信サーバーへ 302 リダイレクトを返します。
転送先は拡張子のない URL とし、`application/octet-stream`、`Content-Disposition: attachment`、
バイト範囲要求への 206 応答で MP3 を返します。ブラウザーが実際に MP3 をデコードして再生・シーク・
再生リストの自動送りを行うことと、転送先の失敗から再試行できることを検証します。
2 つの HTTP サーバーは各試験でループバックアドレスの空きポートを使い、終了時に閉じます。
メディア要素の API と MP3 のバイト列は差し替えません。

再生成する場合は、リポジトリルートで次の PowerShell コマンドを実行します。
エンコーダーは `.git/` 内の作業用ディレクトリにだけ導入し、アプリケーションの依存には追加しません。

```powershell
npm install --prefix .git/safari-audio-fixture --no-save --package-lock=false --ignore-scripts lamejs@1.2.1
@'
import { readFileSync, writeFileSync } from 'node:fs'
import vm from 'node:vm'
const context = vm.createContext({})
vm.runInContext(readFileSync('.git/safari-audio-fixture/node_modules/lamejs/lame.all.js', 'utf8'), context)
const rate = 44100
const encoder = new context.lamejs.Mp3Encoder(1, rate, 64)
const chunks = []
for (let start = 0; start < rate * 60; start += 1152) {
  const samples = new Int16Array(Math.min(1152, rate * 60 - start))
  for (let i = 0; i < samples.length; i++) samples[i] = Math.round(100 * Math.sin((start + i) * 2 * Math.PI * 220 / rate))
  chunks.push(Buffer.from(encoder.encodeBuffer(samples)))
}
chunks.push(Buffer.from(encoder.flush()))
writeFileSync('website/tests/browser/fixtures/tone-60s.mp3', Buffer.concat(chunks))
'@ | node --input-type=module
Get-FileHash website/tests/browser/fixtures/tone-60s.mp3 -Algorithm SHA256
```
