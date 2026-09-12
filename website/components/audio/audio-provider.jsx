'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import catalog from '../../generated/audio.json'
import { createAudioController, initialPlayerSnapshot } from '../../lib/audio-player.mjs'
import { AudioPlayer } from './audio-player'

const AudioContext = createContext(null)

export function AudioProvider({ children }) {
  const element = useRef(null)
  const controller = useRef(null)
  const [state, setState] = useState(initialPlayerSnapshot)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let storage
    try { storage = window.localStorage } catch { /* Private/storage-restricted browsing still plays. */ }
    const player = createAudioController({
      audio: element.current, episodes: catalog.episodes, storage,
      mediaSession: navigator.mediaSession, MediaMetadataClass: window.MediaMetadata
    })
    controller.current = player
    setState(player.getSnapshot())
    setReady(true)
    const unsubscribe = player.subscribe(setState)
    const save = () => player.save()
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', save)
    return () => {
      unsubscribe()
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', save)
      player.destroy()
      controller.current = null
    }
  }, [])
  useEffect(() => {
    document.body.classList.toggle('has-audio-player', Boolean(state.current))
    return () => document.body.classList.remove('has-audio-player')
  }, [state.current])
  const value = { state, catalog, ready, controller: controller.current }
  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio ref={element} preload="none" hidden data-library-audio="true" />
      <AudioPlayer />
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const value = useContext(AudioContext)
  if (!value) throw new Error('AudioProvider is required')
  return value
}
