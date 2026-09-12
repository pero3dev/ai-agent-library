export const AUDIO_STORAGE_KEY = 'ai-agent-library.audio.v1'
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]
const MAX_QUEUE_LENGTH = 1000
const QUEUE_LIMIT_NOTICE = `再生リストは ${MAX_QUEUE_LENGTH} 本までです。不要な音声を外してから追加してください。`

export function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0))
  const hours = Math.floor(seconds / 3600)
  return `${hours ? `${hours}:` : ''}${String(Math.floor(seconds / 60) % 60).padStart(hours ? 2 : 1, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function normalizeArticleRoute(pathname, basePath = '') {
  let path = String(pathname || '').split(/[?#]/)[0]
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) path = path.slice(basePath.length)
  return path.replace(/\.html$/, '').replace(/\/$/, '') || '/'
}

export function latestAudioPublication(episodes) {
  const timestamps = episodes.map(episode => Date.parse(episode.published_at)).filter(Number.isFinite)
  if (!timestamps.length) return null
  const date = new Date(Math.max(...timestamps))
  return {
    iso: date.toISOString(),
    label: new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  }
}

export function audioProblemReportUrl(episode, position = 0) {
  const url = new URL('https://github.com/pero3dev/ai-agent-library/issues/new')
  url.searchParams.set('title', `[音声] ${episode.title} の内容について`)
  url.searchParams.set('body', [
    `音声 ID: ${episode.id}`,
    `記事: https://pero3dev.github.io/ai-agent-library${episode.route}`,
    `元記事の版: ${episode.source_digest}`,
    `再生時刻: ${formatTime(position)}`,
    '', '気になった内容と、期待する説明を記入してください。', ''
  ].join('\n'))
  return url.toString()
}

export function readSavedState(raw, episodes) {
  const initial = { queue: [], currentId: null, positions: {}, rate: 1, notice: '' }
  if (!raw) return initial
  try {
    const saved = JSON.parse(raw)
    if (saved.schema_version !== 1) return initial
    const known = new Map(episodes.map(episode => [episode.id, episode]))
    const ids = Array.isArray(saved.queue) ? saved.queue.filter(id => typeof id === 'string') : []
    const availableIds = [...new Set(ids)].filter(id => known.has(id))
    const queue = availableIds.slice(0, MAX_QUEUE_LENGTH)
    const positions = {}
    for (const [id, value] of Object.entries(saved.positions || {})) {
      if (!known.has(id) || !Number.isFinite(value) || value < 0) continue
      positions[id] = Math.min(value, known.get(id).duration_seconds || value)
    }
    return {
      queue,
      currentId: queue.includes(saved.currentId) ? saved.currentId : null,
      positions,
      rate: PLAYBACK_RATES.includes(saved.rate) ? saved.rate : 1,
      notice: [
        ids.some(id => !known.has(id)) ? '更新・公開終了した音声を再生リストから外しました。新しい版は記事から追加できます。' : '',
        availableIds.length > MAX_QUEUE_LENGTH ? QUEUE_LIMIT_NOTICE : ''
      ].filter(Boolean).join(' ')
    }
  } catch {
    return { ...initial, notice: '保存された再生情報を読み込めなかったため、初期状態で開きました。' }
  }
}

export const initialPlayerSnapshot = {
  queue: [], currentId: null, current: null, position: 0, duration: 0,
  rate: 1, playing: false, loading: false, error: '', notice: '', storageAvailable: true
}

/** A single media element survives route changes. No network request or playback on restore. */
export function createAudioController({ audio, episodes, storage, mediaSession, MediaMetadataClass }) {
  const known = new Map(episodes.map(episode => [episode.id, episode]))
  let saved
  let storageAvailable = true
  try { saved = readSavedState(storage?.getItem(AUDIO_STORAGE_KEY), episodes) } catch {
    saved = readSavedState(null, episodes)
    storageAvailable = false
  }
  if (!storage) storageAvailable = false
  let state = {
    ...initialPlayerSnapshot, ...saved, storageAvailable,
    current: known.get(saved.currentId) || null,
    position: saved.positions[saved.currentId] || 0,
    duration: known.get(saved.currentId)?.duration_seconds || 0
  }
  const positions = saved.positions
  const listeners = new Set()
  const events = []
  let loadedId = null
  let pendingSeek = null
  let lastSave = 0
  let requestVersion = 0
  let destroyed = false
  let metadataId = null

  function emit(patch = {}) {
    state = { ...state, ...patch }
    for (const listener of listeners) listener(state)
  }
  function persist() {
    if (!storageAvailable) return
    try {
      storage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({
        schema_version: 1, queue: state.queue, currentId: state.currentId, positions, rate: state.rate
      }))
    } catch { emit({ storageAvailable: false }) }
  }
  function currentPosition() {
    // UI timeupdate events can lag the native clock, especially while another app is in front.
    // A pending seek or selected-but-unloaded episode must keep its intended position instead.
    if (loadedId === state.currentId && pendingSeek === null && audio.readyState > 0 && Number.isFinite(audio.currentTime)) {
      return Math.max(0, Math.min(audio.currentTime, state.duration || Infinity))
    }
    return state.position
  }
  function savePosition() {
    const position = currentPosition()
    if (position !== state.position) emit({ position })
    if (state.currentId) positions[state.currentId] = position
    persist()
  }
  function updateSession() {
    if (!mediaSession) return
    try {
      mediaSession.playbackState = state.playing ? 'playing' : state.current ? 'paused' : 'none'
      if (state.current && MediaMetadataClass && metadataId !== state.currentId) {
        mediaSession.metadata = new MediaMetadataClass({
          title: state.current.title, artist: 'AI Agent Library', album: state.current.section_title || '音声で学ぶ'
        })
        metadataId = state.currentId
      } else if (!state.current) { mediaSession.metadata = null; metadataId = null }
      if (state.duration > 0 && Number.isFinite(state.duration)) mediaSession.setPositionState?.({
        duration: state.duration, playbackRate: state.rate, position: Math.min(state.position, state.duration)
      })
    } catch { /* OS integration is optional; browser playback remains usable. */ }
  }
  function seek(value) {
    if (!state.current) return
    const position = Math.max(0, Math.min(Number(value) || 0, state.duration || Infinity))
    if (loadedId === state.currentId && audio.readyState > 0) {
      try { audio.currentTime = position; pendingSeek = null } catch { pendingSeek = position }
    } else pendingSeek = position
    emit({ position })
    savePosition()
    updateSession()
  }
  function retryPendingSeek() {
    if (pendingSeek !== null && loadedId === state.currentId && audio.readyState > 0) seek(pendingSeek)
  }
  function setCurrent(id) {
    const episode = known.get(id)
    if (!episode) return false
    savePosition()
    if (id !== state.currentId) {
      requestVersion += 1
      audio.pause()
      loadedId = null
      pendingSeek = positions[id] || 0
      emit({ currentId: id, current: episode, position: pendingSeek, duration: episode.duration_seconds, playing: false, loading: false, error: '' })
      persist()
    }
    return true
  }
  function play() {
    if (!state.current || destroyed) return
    const version = ++requestVersion
    if (loadedId !== state.currentId) {
      loadedId = state.currentId
      pendingSeek = state.position >= state.duration - 0.5 ? 0 : state.position
      audio.src = state.current.audio_url
      audio.load()
    } else if (audio.ended || state.position >= state.duration - 0.5) {
      seek(0)
    }
    audio.playbackRate = state.rate
    emit({ error: '', loading: true })
    // Call directly in the click/ended handler to preserve the browser's playback permission.
    try {
      const promise = audio.play()
      promise?.catch(error => {
        if (destroyed || version !== requestVersion || error?.name === 'AbortError') return
        emit({ playing: false, loading: false, error: error?.name === 'NotAllowedError'
          ? '再生ボタンを押すと続きから聴けます。'
          : '音声を再生できませんでした。通信を確認して、もう一度再生してください。' })
      })
    } catch { emit({ loading: false, error: '音声を再生できませんでした。もう一度再生してください。' }) }
    updateSession()
  }
  function pause() {
    requestVersion += 1
    audio.pause()
    emit({ playing: false, loading: false })
    savePosition()
    updateSession()
  }
  function enqueue(ids) {
    const requested = [...new Set([...state.queue, ...ids.filter(id => known.has(id))])]
    const queue = requested.slice(0, MAX_QUEUE_LENGTH)
    emit({ queue, notice: requested.length > MAX_QUEUE_LENGTH ? QUEUE_LIMIT_NOTICE : state.notice === QUEUE_LIMIT_NOTICE ? '' : state.notice })
    persist()
  }
  function start(id, relatedIds = [id]) {
    enqueue(relatedIds)
    if (!state.queue.includes(id)) enqueue([id])
    if (!state.queue.includes(id)) return false
    if (setCurrent(id)) play()
  }
  function next() {
    const index = state.queue.indexOf(state.currentId)
    if (index < 0) return
    const id = state.queue[index + 1]
    if (id) { setCurrent(id); play() } else pause()
  }
  function remove(id) {
    const index = state.queue.indexOf(id)
    if (index < 0) return
    const queue = state.queue.filter(value => value !== id)
    if (id === state.currentId) {
      pause()
      const replacement = queue[Math.min(index, queue.length - 1)]
      if (replacement) setCurrent(replacement)
      else {
        loadedId = null
        pendingSeek = null
        audio.removeAttribute('src')
        audio.load()
        emit({ currentId: null, current: null, position: 0, duration: 0, error: '' })
      }
    }
    emit({ queue })
    persist()
    updateSession()
  }
  function move(id, offset) {
    const queue = [...state.queue]
    const index = queue.indexOf(id)
    const destination = index + offset
    if (index < 0 || destination < 0 || destination >= queue.length) return
    queue.splice(index, 1)
    queue.splice(destination, 0, id)
    emit({ queue })
    persist()
  }
  function setRate(rate) {
    if (!PLAYBACK_RATES.includes(rate)) return
    audio.playbackRate = rate
    emit({ rate })
    persist()
    updateSession()
  }
  function on(name, callback) {
    audio.addEventListener(name, callback)
    events.push([name, callback])
  }
  on('loadedmetadata', () => {
    if (!loadedId) return
    if (Number.isFinite(audio.duration) && audio.duration > 0) emit({ duration: audio.duration })
    retryPendingSeek()
    updateSession()
  })
  on('timeupdate', () => {
    if (loadedId !== state.currentId || pendingSeek !== null) return
    emit({ position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0 })
    if (Date.now() - lastSave > 5000) { savePosition(); lastSave = Date.now() }
    updateSession()
  })
  on('playing', () => { emit({ playing: true, loading: false, error: '' }); updateSession() })
  on('pause', () => { emit({ playing: false, loading: false }); savePosition(); updateSession() })
  on('waiting', () => emit({ loading: true }))
  on('canplay', () => { retryPendingSeek(); emit({ loading: false }) })
  on('progress', retryPendingSeek)
  on('durationchange', () => {
    if (loadedId && Number.isFinite(audio.duration) && audio.duration > 0) emit({ duration: audio.duration })
    retryPendingSeek()
  })
  on('error', () => {
    if (!loadedId) return
    savePosition()
    loadedId = null
    emit({ playing: false, loading: false, error: '音声を読み込めませんでした。通信を確認して再試行してください。' })
    updateSession()
  })
  on('ended', () => {
    if (!state.currentId || loadedId !== state.currentId || pendingSeek !== null || !audio.ended) return
    // The completed position is zero. Do not sample the old file's ending clock during next().
    loadedId = null
    positions[state.currentId] = 0
    emit({ position: 0, playing: false })
    persist()
    next()
  })
  const handlers = {
    play, pause, nexttrack: next,
    previoustrack: () => seek(0),
    seekbackward: details => seek(currentPosition() - (details.seekOffset || 15)),
    seekforward: details => seek(currentPosition() + (details.seekOffset || 15)),
    seekto: details => seek(details.seekTime),
    stop: pause
  }
  for (const [action, handler] of Object.entries(handlers)) {
    try { mediaSession?.setActionHandler(action, handler) } catch { /* Not every Safari version supports every action. */ }
  }
  updateSession()
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    play, pause, start, enqueue, remove, move, setRate, seek, next, save: savePosition,
    destroy() {
      destroyed = true
      requestVersion += 1
      savePosition()
      for (const [name, callback] of events) audio.removeEventListener(name, callback)
      audio.pause()
      for (const action of Object.keys(handlers)) {
        try { mediaSession?.setActionHandler(action, null) } catch { /* optional */ }
      }
      listeners.clear()
    }
  }
}
