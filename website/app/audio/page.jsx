import { AudioLibrary } from '../../components/audio/audio-library'

export const metadata = {
  title: '音声で学ぶ',
  description: 'AI Agent の学習記事を、二人の対話で聴く音声ライブラリ。通勤や散歩の時間に、仕組みと設計の理由を学べます。'
}

export default function AudioPage() {
  return <main id="nextra-skip-nav" tabIndex={-1} className="page-shell audio-page">
    <p className="home-section-kicker">LISTEN & LEARN</p>
    <h1 className="page-title">音声で学ぶ</h1>
    <p className="page-lead">通勤や散歩の時間を、AI Agent を学ぶ時間に。</p>
    <AudioLibrary />
  </main>
}
