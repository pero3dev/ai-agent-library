import { ImageResponse } from 'next/og'

// サイト全体の OG 画像(ビルド時に静的生成される)。
// 注: ImageResponse(satori)は日本語フォントを同梱しないため、文言は英語のみで構成する。
// output: 'export' では静的生成の明示が必須(ないとビルドエラー)
export const dynamic = 'force-static'
export const alt = 'AI Agent Library'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9999,
              background: '#38bdf8'
            }}
          />
          <div style={{ fontSize: 34, color: '#94a3b8', letterSpacing: 4 }}>
            OBSERVE · THINK · ACT
          </div>
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 28, lineHeight: 1.1 }}>
          AI Agent Library
        </div>
        <div style={{ fontSize: 36, color: '#cbd5e1', marginTop: 28, lineHeight: 1.4 }}>
          Practical design decisions for building, evaluating,
        </div>
        <div style={{ fontSize: 36, color: '#cbd5e1', lineHeight: 1.4 }}>
          and operating AI agents
        </div>
        <div style={{ fontSize: 28, color: '#64748b', marginTop: 48 }}>
          Concepts · Architecture · Implementation · Evaluation · Operations · Security
        </div>
      </div>
    ),
    size
  )
}
