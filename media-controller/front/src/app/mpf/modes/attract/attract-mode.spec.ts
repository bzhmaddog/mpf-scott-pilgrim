/// <reference types="vitest/globals" />
import {TestBed} from '@angular/core/testing';
import {AttractMode} from './attract-mode';
import {GameStore} from '../../../store/game.store';
import {makeMpfMocks, MockLayerGroup, MpfMocks, provideMpfMocks} from '../../testing/mpf-mocks';

const ATTRACT_RESTART_TIMEOUT = 300000

describe('AttractMode', () => {
  let mocks: MpfMocks
  let mode: AttractMode

  const createMode = (resourceError?: unknown) => {
    mocks = makeMpfMocks(resourceError)
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({providers: provideMpfMocks(mocks)})
    mode = TestBed.runInInjectionContext(() => new AttractMode())
  }

  /** Layer groups created by init(): [attract-scene, gameover-scene] */
  const sceneGroups = (): {attract: MockLayerGroup, gameOver: MockLayerGroup} => ({
    attract: mocks.dmd.groups[0],
    gameOver: mocks.dmd.groups[1],
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('init()', () => {
    it('loads the sounds, images and video', async () => {
      createMode()

      await mode.init()

      expect(mode.isInitialized()).toBe(true)
      await vi.waitFor(() => {
        expect(mocks.audio.addSound).toHaveBeenCalledWith('attract', expect.anything())
        expect(mocks.audio.addSound).toHaveBeenCalledWith('dong', expect.anything())
      })
      const {gameOver} = sceneGroups()
      expect(gameOver.layer.setVideo).toHaveBeenCalled()
      expect(gameOver.layer.drawBitmap).toHaveBeenCalledTimes(2)
      expect(sceneGroups().attract.layer.drawBitmap).toHaveBeenCalled()
    })

    it('logs every resource that fails to load instead of leaving unhandled rejections', async () => {
      const error = new Error('404')
      createMode(error)

      await mode.init()

      const expected = [
        'Failed to load title image',
        'Failed to load attract music',
        'Failed to load dong sound',
        'Failed to load gameover-clouds video',
        'Failed to load gameover-clouds image',
        'Failed to load gameover-bg image',
      ]
      await vi.waitFor(() => {
        for (const message of expected) {
          expect(mocks.logger.error).toHaveBeenCalledWith(message, error)
        }
      })
      expect(mocks.audio.addSound).not.toHaveBeenCalled()
    })
  })

  describe('start()', () => {
    beforeEach(async () => {
      createMode()
      await mode.init()
    })

    afterEach(() => {
      if (mode.isStarted()) mode.stop()
    })

    it('refuses to start when not initialized', () => {
      createMode()
      expect(mode.start(1)).toBe(false)
    })

    it('fades the DMD in before starting the attract music', async () => {
      mocks.dmd.brightness = 0

      expect(mode.start(1)).toBe(true)

      expect(sceneGroups().attract.setVisibility).toHaveBeenCalledWith(true)
      expect(mocks.dmd.fadeIn).toHaveBeenCalledWith(150)
      await vi.waitFor(() =>
        expect(mocks.audio.playSound).toHaveBeenCalledWith('attract', 'attract-music', false, expect.any(Function))
      )
    })

    it('starts the music right away when the DMD is already visible', () => {
      mocks.dmd.brightness = 1

      mode.start(1)

      expect(mocks.dmd.fadeIn).not.toHaveBeenCalled()
      expect(mocks.audio.playSound).toHaveBeenCalledWith('attract', 'attract-music', false, expect.any(Function))
    })

    it('logs an error when the DMD fade in fails', async () => {
      mocks.dmd.brightness = 0
      const error = new Error('fade failed')
      mocks.dmd.fadeIn.mockRejectedValue(error)

      mode.start(1)

      await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('DMD fade in failed', error))
      expect(mocks.audio.playSound).not.toHaveBeenCalled()
    })
  })

  describe('after a game', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      createMode()
      const store = TestBed.inject(GameStore)
      store.addPlayer()
      store.addPlayer()
      await mode.init()
      // A game was played: start then stop the mode once
      mode.start(1)
      mode.stop()
      mocks.dmd.addLayer.mockClear()
      mocks.dmd.fadeIn.mockClear()
      mocks.dmd.fadeOut.mockClear()
    })

    afterEach(() => {
      if (mode.isStarted()) mode.stop()
    })

    it('shows the game over scene with one score line per player', async () => {
      mode.start(1)

      await vi.advanceTimersByTimeAsync(2000)

      const {gameOver} = sceneGroups()
      expect(mocks.dmd.fadeOut).toHaveBeenCalledWith(150)
      expect(gameOver.setVisibility).toHaveBeenCalledWith(true)
      expect(gameOver.layer.play).toHaveBeenCalled()
      const scoreLayers = mocks.dmd.addLayer.mock.calls.map(call => call[1])
      expect(scoreLayers).toEqual(['game-over-score-0', 'game-over-score-1'])
      expect(mocks.audio.playSound).toHaveBeenCalledWith('dong', 'dong-p2')
    })

    it('goes back to the attract scene after the restart timeout', async () => {
      mode.start(1)

      await vi.advanceTimersByTimeAsync(ATTRACT_RESTART_TIMEOUT)

      const {gameOver, attract} = sceneGroups()
      expect(gameOver.layer.stop).toHaveBeenCalled()
      expect(gameOver.setVisibility).toHaveBeenLastCalledWith(false)
      expect(mocks.dmd.removeLayer).toHaveBeenCalledWith('game-over-score-0')
      expect(mocks.dmd.removeLayer).toHaveBeenCalledWith('game-over-score-1')
      expect(attract.setVisibility).toHaveBeenLastCalledWith(true)
    })

    it('does not restart the attract scene when the mode was stopped meanwhile', async () => {
      mode.start(1)
      let finishFade!: () => void
      mocks.dmd.fadeOut.mockReturnValue(new Promise<void>(resolve => finishFade = resolve))

      await vi.advanceTimersByTimeAsync(ATTRACT_RESTART_TIMEOUT - 1)
      // The restart timer fires and waits for the fade out
      await vi.advanceTimersByTimeAsync(1)
      mode.stop()
      finishFade()
      await vi.advanceTimersByTimeAsync(0)

      expect(mocks.dmd.removeLayer).not.toHaveBeenCalled()
    })

    it('logs errors when the game over / restart transitions fail', async () => {
      const error = new Error('fade failed')
      mocks.dmd.fadeOut.mockRejectedValue(error)

      mode.start(1)
      await vi.advanceTimersByTimeAsync(ATTRACT_RESTART_TIMEOUT)

      expect(mocks.logger.error).toHaveBeenCalledWith('Failed to show game over scene', error)
      expect(mocks.logger.error).toHaveBeenCalledWith('Failed to restart attract mode', error)
    })
  })
})
