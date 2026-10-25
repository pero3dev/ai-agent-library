import AVFoundation
import Combine
import MediaPlayer
import UIKit

/// The prototype streams one existing release asset after an explicit play action.
/// No audio file is bundled, downloaded for offline use, or persisted by this class.
@MainActor
final class AudioPlayer: ObservableObject {
    let episode: AudioEpisode
    static let supportedRates: [Double] = [0.75, 1, 1.25, 1.5, 1.75, 2]

    @Published private(set) var position: Double
    @Published private(set) var duration: Double
    @Published private(set) var playbackRate: Double
    @Published private(set) var isPlaying = false
    @Published private(set) var isBuffering = false
    @Published private(set) var isPlaybackRequested = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var statusMessage: String?

    private var player: AVPlayer
    private let makePlayer: () -> AVPlayer
    private let defaults: UserDefaults
    private let storageKey: String
    private var timeObserver: Any?
    private var playerObservation: NSKeyValueObservation?
    private var playerStatusObservation: NSKeyValueObservation?
    private var itemObservation: NSKeyValueObservation?
    private var notifications: [NSObjectProtocol] = []
    private var remoteTargets: [(MPRemoteCommand, Any)] = []
    private var pendingRestore = false
    private var isSeeking = false
    private var needsPlayerRecreation = false
    private var seekGeneration = 0
    private var waitGeneration = 0
    private var lastSavedPosition: Double = 0
    private var resumeAfterInterruption = false
    private var isInterrupted = false
    private var ownsAudioSession = false

    var currentChapter: AudioChapter? {
        episode.chapters.last { $0.start_seconds <= position }
    }

    init(episode: AudioEpisode, defaults: UserDefaults = .standard,
         makePlayer: @escaping () -> AVPlayer = { AVPlayer() }) {
        self.episode = episode
        self.defaults = defaults
        self.makePlayer = makePlayer
        player = makePlayer()
        storageKey = "ios.audio.\(episode.id)"
        let initialDuration = max(episode.duration_seconds, 1)
        duration = initialDuration
        let savedPosition = defaults.double(forKey: "\(storageKey).position")
        position = savedPosition.isFinite ? min(max(savedPosition, 0), initialDuration) : 0
        let savedRate = defaults.double(forKey: "\(storageKey).rate")
        playbackRate = Self.supportedRates.contains(savedRate) ? savedRate : 1
        lastSavedPosition = position
        player.automaticallyWaitsToMinimizeStalling = true
        observePlayer()
        observeNotifications()
        // In particular, do not create AVPlayerItem or activate AVAudioSession here.
        // Restoring a reading screen must not begin playback or network access.
    }

    deinit {
        player.pause()
        if let timeObserver { player.removeTimeObserver(timeObserver) }
        playerObservation?.invalidate()
        playerStatusObservation?.invalidate()
        itemObservation?.invalidate()
        for notification in notifications { NotificationCenter.default.removeObserver(notification) }
        for (command, target) in remoteTargets { command.removeTarget(target) }
        if ownsAudioSession {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
    }

    func togglePlayback() {
        if isPlaybackRequested { pause() } else { play() }
    }

    func play() {
        guard !isInterrupted else {
            statusMessage = "着信などの割り込みが終わってから再生してください。"
            return
        }
        guard Self.allowedAudioURL(for: episode) != nil else {
            fail("試作で許可されていない音声URLです。記事データを確認してください。")
            return
        }
        if errorMessage != nil {
            retry()
            return
        }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio)
            try session.setActive(true)
            ownsAudioSession = true
        } catch {
            fail("音声の再生準備ができませんでした。再試行してください。")
            return
        }
        isPlaybackRequested = true
        statusMessage = nil
        installRemoteCommandsIfNeeded()
        if position >= duration - 1 {
            position = 0
            pendingRestore = true
        }
        if player.currentItem == nil {
            prepareItem()
        } else if player.currentItem?.status == .readyToPlay {
            if pendingRestore { restorePositionAndPlayIfRequested() } else { beginPlayback() }
        } else {
            isBuffering = true
            scheduleWaitTimeout()
        }
        updateNowPlaying()
    }

    func pause() {
        resumeAfterInterruption = false
        isPlaybackRequested = false
        player.pause()
        isPlaying = false
        isBuffering = false
        waitGeneration += 1
        persistProgress()
        updateNowPlaying()
        if ownsAudioSession {
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
    }

    func retry() {
        pause()
        seekGeneration += 1
        isSeeking = false
        itemObservation?.invalidate()
        itemObservation = nil
        player.replaceCurrentItem(with: nil)
        if needsPlayerRecreation || player.status == .failed {
            if let timeObserver { player.removeTimeObserver(timeObserver) }
            timeObserver = nil
            playerObservation?.invalidate()
            playerStatusObservation?.invalidate()
            player = makePlayer()
            player.automaticallyWaitsToMinimizeStalling = true
            observePlayer()
            needsPlayerRecreation = false
        }
        pendingRestore = true
        errorMessage = nil
        statusMessage = nil
        play()
    }

    func setRate(_ value: Double) {
        guard Self.supportedRates.contains(value) else { return }
        playbackRate = value
        player.defaultRate = Float(value)
        // A nonzero rate also records the desired speed while buffering. defaultRate
        // alone only affects the next play(), so a stalled player would resume too slowly.
        if player.rate != 0 { player.rate = Float(value) }
        persistProgress()
        updateNowPlaying()
    }

    func skip(by seconds: Double) { seek(to: position + seconds) }

    func seek(to seconds: Double) {
        guard seconds.isFinite else { return }
        position = min(max(seconds, 0), duration)
        persistProgress()
        updateNowPlaying()
        guard player.currentItem?.status == .readyToPlay else {
            pendingRestore = true
            return
        }
        performSeek(to: position)
    }

    func selectChapter(_ chapter: AudioChapter) { seek(to: chapter.start_seconds) }

    func persistProgress() {
        defaults.set(position, forKey: "\(storageKey).position")
        defaults.set(playbackRate, forKey: "\(storageKey).rate")
        defaults.set(currentChapter?.id, forKey: "\(storageKey).chapter")
        lastSavedPosition = position
    }

    /// Exact release identity is intentional: an imported snapshot cannot turn the
    /// prototype into an arbitrary remote media client. GitHub handles its HTTPS CDN redirect.
    static func allowedAudioURL(for episode: AudioEpisode) -> URL? {
        let identifier = "01-concepts--agent-loop-3c6f324e5d0d-7ab8a0e6323a-47803c3cb76f-p01"
        let digest = "47803c3cb76f5e737a3d2f11a8878886590d4159363f52c453bd44396214942e"
        let path = "/pero3dev/ai-agent-library/releases/download/"
            + "audio-agent-loop-3c6f324e5d0d4a60-7ab8a0e6323a20e7/"
            + "\(identifier)-47803c3cb76f5e73.mp3"
        guard episode.id == identifier, episode.sha256 == digest,
              let parts = URLComponents(string: episode.url),
              parts.scheme == "https", parts.host == "github.com", parts.port == nil,
              parts.user == nil, parts.password == nil, parts.query == nil, parts.fragment == nil,
              parts.percentEncodedPath == path else { return nil }
        return parts.url
    }

    private func prepareItem() {
        guard let url = Self.allowedAudioURL(for: episode) else { return }
        // The allowlisted MP3 is served by GitHub as application/octet-stream.
        // The public iOS 17 option keeps format detection independent of the CDN URL.
        let asset = AVURLAsset(url: url, options: [AVURLAssetOverrideMIMETypeKey: "audio/mpeg"])
        let item = AVPlayerItem(asset: asset)
        pendingRestore = true
        isBuffering = true
        itemObservation = item.observe(\.status, options: [.initial, .new]) { [weak self] item, _ in
            DispatchQueue.main.async { [weak self, weak item] in
                guard let self, let item, self.player.currentItem === item else { return }
                switch item.status {
                case .readyToPlay:
                    let seconds = item.duration.seconds
                    if seconds.isFinite && seconds > 0 { self.duration = seconds }
                    self.restorePositionAndPlayIfRequested()
                case .failed:
                    self.fail("音声を読み込めませんでした。接続を確認して再試行してください。")
                case .unknown: break
                @unknown default: break
                }
            }
        }
        player.replaceCurrentItem(with: item)
        scheduleWaitTimeout()
    }

    private func restorePositionAndPlayIfRequested() {
        guard pendingRestore else {
            if isPlaybackRequested { beginPlayback() }
            return
        }
        pendingRestore = false
        performSeek(to: position)
    }

    private func performSeek(to seconds: Double) {
        seekGeneration += 1
        let generation = seekGeneration
        isSeeking = true
        player.seek(to: CMTime(seconds: seconds, preferredTimescale: 600),
                    toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] finished in
            DispatchQueue.main.async { [weak self] in
                guard let self, generation == self.seekGeneration else { return }
                self.isSeeking = false
                guard finished else { return }
                if self.isPlaybackRequested { self.beginPlayback() }
                else { self.isBuffering = false }
                self.updateNowPlaying()
            }
        }
    }

    private func beginPlayback() {
        guard isPlaybackRequested, !isInterrupted else { return }
        player.defaultRate = Float(playbackRate)
        player.play()
        updateNowPlaying()
    }

    private func observePlayer() {
        playerStatusObservation = player.observe(\.status, options: [.new]) { [weak self] observed, _ in
            DispatchQueue.main.async { [weak self, weak observed] in
                guard let self, let observed, self.player === observed, observed.status == .failed else { return }
                self.needsPlayerRecreation = true
                self.fail("音声の再生を続けられませんでした。再試行してください。")
            }
        }
        playerObservation = player.observe(\.timeControlStatus, options: [.new]) { [weak self] observed, _ in
            DispatchQueue.main.async { [weak self, weak observed] in
                guard let self, let observed, self.player === observed else { return }
                self.isPlaying = self.player.timeControlStatus == .playing
                self.isBuffering = self.isPlaybackRequested && !self.isPlaying
                if self.isPlaying {
                    self.waitGeneration += 1
                    self.statusMessage = nil
                } else if self.isBuffering { self.scheduleWaitTimeout() }
                self.updateNowPlaying()
            }
        }
        let observedPlayer = player
        timeObserver = observedPlayer.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 1, preferredTimescale: 600), queue: .main
        ) { [weak self, weak observedPlayer] time in
            DispatchQueue.main.async { [weak self, weak observedPlayer] in
                guard let self, let observedPlayer, self.player === observedPlayer,
                      time.seconds.isFinite, !self.pendingRestore, !self.isSeeking else { return }
                self.position = min(max(time.seconds, 0), self.duration)
                if abs(self.position - self.lastSavedPosition) >= 5 { self.persistProgress() }
                self.updateNowPlaying()
            }
        }
    }

    private func observeNotifications() {
        let center = NotificationCenter.default
        notifications.append(center.addObserver(forName: AVAudioSession.interruptionNotification,
                                                object: nil, queue: .main) { [weak self] notice in
            let rawType = notice.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
            let rawOptions = notice.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
            DispatchQueue.main.async { [weak self] in
                self?.handleInterruption(type: rawType, options: rawOptions)
            }
        })
        notifications.append(center.addObserver(forName: AVAudioSession.routeChangeNotification,
                                                object: nil, queue: .main) { [weak self] notice in
            let rawReason = notice.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt
            DispatchQueue.main.async { [weak self] in
                guard rawReason == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue else { return }
                self?.pause()
                self?.statusMessage = "イヤホンなどの接続が切れたため停止しました。"
            }
        })
        notifications.append(center.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification,
                                                object: nil, queue: .main) { [weak self] _ in
            DispatchQueue.main.async { [weak self] in
                self?.needsPlayerRecreation = true
                self?.isInterrupted = false
                self?.fail("音声サービスが再起動しました。再試行してください。")
            }
        })
        for name in [UIApplication.didEnterBackgroundNotification, UIApplication.willTerminateNotification] {
            notifications.append(center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                DispatchQueue.main.async { [weak self] in self?.persistProgress() }
            })
        }
        notifications.append(center.addObserver(forName: .AVPlayerItemDidPlayToEndTime,
                                                object: nil, queue: .main) { [weak self] notice in
            guard let item = notice.object as? AVPlayerItem else { return }
            DispatchQueue.main.async { [weak self, weak item] in
                guard let self, let item, self.player.currentItem === item else { return }
                self.pause()
                self.position = self.duration
                self.persistProgress()
                self.statusMessage = "最後まで再生しました。"
                self.updateNowPlaying()
            }
        })
        notifications.append(center.addObserver(forName: .AVPlayerItemFailedToPlayToEndTime,
                                                object: nil, queue: .main) { [weak self] notice in
            guard let item = notice.object as? AVPlayerItem else { return }
            DispatchQueue.main.async { [weak self, weak item] in
                guard let self, let item, self.player.currentItem === item else { return }
                self.fail("音声の再生が中断されました。接続を確認して再試行してください。")
            }
        })
        notifications.append(center.addObserver(forName: .AVPlayerItemPlaybackStalled,
                                                object: nil, queue: .main) { [weak self] notice in
            guard let item = notice.object as? AVPlayerItem else { return }
            DispatchQueue.main.async { [weak self, weak item] in
                guard let self, let item, self.player.currentItem === item, self.isPlaybackRequested else { return }
                self.isBuffering = true
                self.statusMessage = "音声の読み込みを待っています。接続状態を確認してください。"
                self.scheduleWaitTimeout()
            }
        })
    }

    private func handleInterruption(type: UInt?, options: UInt) {
        guard let type, let kind = AVAudioSession.InterruptionType(rawValue: type) else { return }
        switch kind {
        case .began:
            let shouldResume = isPlaybackRequested
            pause()
            isInterrupted = true
            resumeAfterInterruption = shouldResume
            statusMessage = "着信などの割り込みのため停止しました。"
        case .ended:
            isInterrupted = false
            let shouldResume = resumeAfterInterruption
                && AVAudioSession.InterruptionOptions(rawValue: options).contains(.shouldResume)
            resumeAfterInterruption = false
            if shouldResume { play() }
            else { statusMessage = "再生ボタンで続きから再開できます。" }
        @unknown default: break
        }
    }

    private func scheduleWaitTimeout() {
        waitGeneration += 1
        let generation = waitGeneration
        DispatchQueue.main.asyncAfter(deadline: .now() + 30) { [weak self] in
            guard let self, generation == self.waitGeneration,
                  self.isPlaybackRequested, !self.isPlaying else { return }
            self.fail("音声の読み込みが進みませんでした。接続を確認して再試行してください。")
        }
    }

    private func fail(_ message: String) {
        pause()
        errorMessage = message
        statusMessage = nil
    }

    private func installRemoteCommandsIfNeeded() {
        guard remoteTargets.isEmpty else { return }
        let center = MPRemoteCommandCenter.shared()
        addRemoteTarget(center.playCommand) { $0.play() }
        addRemoteTarget(center.pauseCommand) { $0.pause() }
        addRemoteTarget(center.togglePlayPauseCommand) { $0.togglePlayback() }
        center.skipForwardCommand.preferredIntervals = [15]
        center.skipBackwardCommand.preferredIntervals = [15]
        addRemoteTarget(center.skipForwardCommand) { $0.skip(by: 15) }
        addRemoteTarget(center.skipBackwardCommand) { $0.skip(by: -15) }
        center.changePlaybackPositionCommand.isEnabled = true
        let target = center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let event = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            let seconds = event.positionTime
            guard seconds.isFinite else { return .commandFailed }
            DispatchQueue.main.async { [weak self] in self?.seek(to: seconds) }
            return .success
        }
        remoteTargets.append((center.changePlaybackPositionCommand, target))
    }

    private func addRemoteTarget(_ command: MPRemoteCommand,
                                 action: @escaping @MainActor (AudioPlayer) -> Void) {
        command.isEnabled = true
        let target = command.addTarget { [weak self] _ in
            guard self != nil else { return .commandFailed }
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                action(self)
            }
            return .success
        }
        remoteTargets.append((command, target))
    }

    private func updateNowPlaying() {
        guard ownsAudioSession else { return }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: episode.title,
            MPMediaItemPropertyArtist: episode.credit,
            MPMediaItemPropertyAlbumTitle: "AI Agent Library",
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: position,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? playbackRate : 0,
            MPNowPlayingInfoPropertyDefaultPlaybackRate: playbackRate,
            MPNowPlayingInfoPropertyIsLiveStream: false,
            MPNowPlayingInfoPropertyExternalContentIdentifier: episode.id
        ]
    }
}
