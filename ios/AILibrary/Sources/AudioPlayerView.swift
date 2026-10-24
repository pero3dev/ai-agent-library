import SwiftUI

@MainActor
struct AudioPlayerView: View {
    @StateObject private var player: AudioPlayer
    @State private var isScrubbing = false
    @State private var scrubPosition: Double = 0
    @Environment(\.scenePhase) private var scenePhase

    init(episode: AudioEpisode) {
        _player = StateObject(wrappedValue: AudioPlayer(episode: episode))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(player.episode.title).font(.title2.bold()).accessibilityAddTraits(.isHeader)
                    Text("音声はオンライン再生です。再生ボタンを押すとGitHubの配信先へ接続します。")
                        .font(.subheadline).foregroundStyle(.secondary)
                    if !player.episode.source_is_current {
                        Label("この音声は旧記事版をもとにしています。現在の本文と異なる場合があります。",
                              systemImage: "info.circle")
                            .font(.subheadline)
                    }
                }

                playbackControls

                if let message = player.errorMessage {
                    VStack(alignment: .leading, spacing: 12) {
                        Label(message, systemImage: "exclamationmark.triangle")
                        Button("続きから再試行", action: player.retry)
                            .buttonStyle(.borderedProminent)
                            .accessibilityHint("通信を再開して保存した位置から再生します")
                    }
                    .padding().background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
                } else if let message = player.statusMessage {
                    Text(message).font(.subheadline).foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("チャプター").font(.headline).accessibilityAddTraits(.isHeader)
                    ForEach(player.episode.chapters) { chapter in
                        Button {
                            player.selectChapter(chapter)
                        } label: {
                            HStack(alignment: .firstTextBaseline, spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(chapter.title).multilineTextAlignment(.leading)
                                    if player.currentChapter?.id == chapter.id {
                                        Text("現在の章").font(.caption).fontWeight(.semibold)
                                    }
                                }
                                Spacer(minLength: 8)
                                Text(clock(chapter.start_seconds)).font(.caption.monospacedDigit())
                            }
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(chapter.title)、\(spokenTime(chapter.start_seconds))から")
                        .accessibilityHint("この章の先頭へ移動します")
                        .accessibilityValue(player.currentChapter?.id == chapter.id ? "現在の章" : "")
                        Divider()
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("音声クレジット").font(.headline).accessibilityAddTraits(.isHeader)
                    Text(player.episode.credit).font(.footnote)
                    if let url = licenseURL {
                        Link("音声合成エンジンの利用規約（外部サイト）", destination: url).font(.footnote)
                    }
                    Text("音声ファイルのオフライン保存には対応していません。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .padding()
        }
        .navigationTitle("音声で学ぶ")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: scenePhase) { _, phase in
            if phase != .active { player.persistProgress() }
        }
        .onDisappear { player.persistProgress() }
    }

    private var playbackControls: some View {
        VStack(spacing: 16) {
            Slider(value: Binding(
                get: { isScrubbing ? scrubPosition : player.position },
                set: { scrubPosition = $0 }
            ), in: 0...max(player.duration, 1)) { editing in
                if editing {
                    scrubPosition = player.position
                    isScrubbing = true
                } else {
                    isScrubbing = false
                    player.seek(to: scrubPosition)
                }
            }
            .accessibilityLabel("音声の再生位置")
            .accessibilityValue("\(spokenTime(player.position))、全体\(spokenTime(player.duration))")
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment: player.skip(by: 15)
                case .decrement: player.skip(by: -15)
                @unknown default: break
                }
            }

            HStack {
                Text(clock(isScrubbing ? scrubPosition : player.position))
                Spacer()
                Text(clock(player.duration))
            }
            .font(.caption.monospacedDigit()).foregroundStyle(.secondary)
            .accessibilityHidden(true)

            HStack(spacing: 36) {
                Button { player.skip(by: -15) } label: {
                    Image(systemName: "gobackward.15").font(.title)
                }
                .frame(minWidth: 44, minHeight: 44).accessibilityLabel("15秒戻る")
                Button(action: player.togglePlayback) {
                    Image(systemName: player.isPlaybackRequested ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 60))
                }
                .accessibilityLabel(player.isPlaybackRequested ? "一時停止" : "続きから再生")
                Button { player.skip(by: 15) } label: {
                    Image(systemName: "goforward.15").font(.title)
                }
                .frame(minWidth: 44, minHeight: 44).accessibilityLabel("15秒進む")
            }
            .buttonStyle(.plain)

            if player.isBuffering {
                ProgressView("音声を読み込み中…").font(.subheadline)
            }
            Picker("再生速度", selection: Binding(get: { player.playbackRate }, set: { player.setRate($0) })) {
                ForEach(AudioPlayer.supportedRates, id: \.self) { rate in
                    Text("\(rate.formatted())倍").tag(rate)
                }
            }
            .pickerStyle(.menu)
            .accessibilityLabel("再生速度")
            .accessibilityValue("\(player.playbackRate.formatted())倍")
        }
    }

    private var licenseURL: URL? {
        guard let parts = URLComponents(string: player.episode.license_url),
              parts.scheme == "https", parts.host == "voicevox.hiroshiba.jp",
              parts.path == "/nemo/term/", parts.user == nil, parts.password == nil,
              parts.port == nil, parts.query == nil, parts.fragment == nil else { return nil }
        return parts.url
    }

    private func clock(_ seconds: Double) -> String {
        let value = AudioTime.displaySeconds(seconds)
        return String(format: "%d:%02d", value / 60, value % 60)
    }

    private func spokenTime(_ seconds: Double) -> String {
        let value = AudioTime.displaySeconds(seconds)
        return "\(value / 60)分\(value % 60)秒"
    }
}
