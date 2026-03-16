/**
 * Audio Manager para iOS Safari compatibility.
 *
 * iOS Safari bloqueia audio.play() se não for resultado direto de user gesture.
 * Este manager "destrava" um único elemento <audio> no primeiro toque do usuário,
 * e reutiliza ele para todas as reproduções subsequentes — inclusive automáticas.
 *
 * Uso:
 *   import { audioManager } from '@/lib/audioManager'
 *   await audioManager.play(blobUrl)
 *   audioManager.stop()
 */

// Tiny silent WAV (44 bytes) as base64 data URI — used to "unlock" audio on iOS
const SILENT_AUDIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

class AudioManager {
  private audio: HTMLAudioElement | null = null
  private unlocked = false
  private unlockPromise: Promise<void> | null = null
  private onEndedCallback: (() => void) | null = null
  private onErrorCallback: (() => void) | null = null
  private currentBlobUrl: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init() {
    // Create persistent audio element
    this.audio = new Audio()
    // iOS Safari: mark as inline playback (no fullscreen)
    this.audio.setAttribute('playsinline', '')
    this.audio.setAttribute('webkit-playsinline', '')

    // Listen for first user interaction to unlock audio
    const unlockHandler = () => {
      if (this.unlocked) return
      this.unlock()
      // Remove listeners after first unlock
      document.removeEventListener('touchstart', unlockHandler, true)
      document.removeEventListener('touchend', unlockHandler, true)
      document.removeEventListener('click', unlockHandler, true)
    }

    document.addEventListener('touchstart', unlockHandler, true)
    document.addEventListener('touchend', unlockHandler, true)
    document.addEventListener('click', unlockHandler, true)
  }

  private unlock() {
    if (this.unlocked || !this.audio) return

    this.unlockPromise = (async () => {
      try {
        this.audio!.src = SILENT_AUDIO
        this.audio!.volume = 0
        await this.audio!.play()
        this.audio!.pause()
        this.audio!.volume = 1
        this.audio!.currentTime = 0
        this.unlocked = true
        console.log('[AudioManager] Audio unlocked for iOS')
      } catch (e) {
        console.warn('[AudioManager] Failed to unlock audio:', e)
      }
    })()
  }

  /**
   * Play audio from a blob URL or data URL.
   * Works on iOS because the <audio> element was "unlocked" on first user touch.
   */
  async play(url: string, options?: {
    onEnded?: () => void
    onError?: () => void
  }): Promise<void> {
    if (!this.audio) {
      this.init()
    }

    // Wait for unlock if it's in progress
    if (this.unlockPromise) {
      await this.unlockPromise
    }

    // Stop any current playback
    this.stop()

    // Set up callbacks
    this.onEndedCallback = options?.onEnded || null
    this.onErrorCallback = options?.onError || null
    this.currentBlobUrl = url

    this.audio!.onended = () => {
      this.onEndedCallback?.()
      this.onEndedCallback = null
      this.currentBlobUrl = null
    }

    this.audio!.onerror = () => {
      this.onErrorCallback?.()
      this.onErrorCallback = null
      this.currentBlobUrl = null
    }

    this.audio!.src = url
    this.audio!.volume = 1

    try {
      await this.audio!.play()
    } catch (e) {
      console.warn('[AudioManager] Play failed:', e)
      this.onErrorCallback?.()
      this.onErrorCallback = null
    }
  }

  /**
   * Stop current playback.
   */
  stop() {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.audio.onended = null
      this.audio.onerror = null
    }
    this.onEndedCallback = null
    this.onErrorCallback = null
  }

  /**
   * Check if currently playing.
   */
  get isPlaying(): boolean {
    return !!this.audio && !this.audio.paused && !this.audio.ended
  }

  /**
   * Check if the audio is unlocked (ready for autoplay).
   */
  get isUnlocked(): boolean {
    return this.unlocked
  }
}

// Singleton instance
export const audioManager = typeof window !== 'undefined'
  ? new AudioManager()
  : (null as unknown as AudioManager)
