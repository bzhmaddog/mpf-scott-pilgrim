/// <reference types="vitest/globals" />
import {TestBed} from '@angular/core/testing';
import {Utils} from 'h5dmd';
import {GameMode} from './game-mode';
import {makeMpfMocks, MockLayerGroup, MpfMocks, provideMpfMocks} from '../../testing/mpf-mocks';

describe('GameMode', () => {
  let mocks: MpfMocks
  let mode: GameMode

  const createMode = () => {
    mocks = makeMpfMocks()
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({providers: provideMpfMocks(mocks)})
    mode = TestBed.runInInjectionContext(() => new GameMode())
  }

  /** Layer groups created by init(): hud > [player, ball] */
  const hud = (): MockLayerGroup => mocks.dmd.groups[0]

  beforeEach(() => {
    vi.spyOn(Utils, 'loadImagesOrdered').mockResolvedValue([])
    vi.spyOn(Utils, 'bitmapsToPixelData').mockReturnValue([])
    vi.stubGlobal('createImageBitmap', vi.fn(() => Promise.resolve({} as ImageBitmap)))
    createMode()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('init()', () => {
    it('loads the start sound and builds the hidden HUD with animated sprites', async () => {
      await mode.init()

      expect(mode.isInitialized()).toBe(true)
      expect(mocks.audio.addSound).toHaveBeenCalledWith('start', expect.anything())
      expect(mocks.dmd.addLayerGroup).toHaveBeenCalledWith('hud', {visible: false})
      const [player, ball] = hud().groups
      await vi.waitFor(() => {
        expect(player.layer.run).toHaveBeenCalledWith('scott-face')
        expect(ball.layer.run).toHaveBeenCalledWith('rolling-ball')
      })
      expect(player.layer.createSprite).toHaveBeenCalledWith('scott-face', expect.anything(), 0, 0, expect.any(Array), '0', '0')
      expect(ball.layer.enqueueSequence).toHaveBeenCalledWith('rolling-ball', [{key: 'idle', nbLoop: 0}], true)
    })

    it('logs sprite setup failures instead of leaving unhandled rejections', async () => {
      const error = new Error('decode failed')
      vi.stubGlobal('createImageBitmap', vi.fn(() => Promise.reject(error)))

      await mode.init()

      await vi.waitFor(() => {
        expect(mocks.logger.error).toHaveBeenCalledWith('Failed to set up player-face', error)
        expect(mocks.logger.error).toHaveBeenCalledWith('Failed to set up ball-sprite', error)
      })
    })
  })

  describe('start()', () => {
    it('refuses to start when not initialized', () => {
      expect(mode.start(1)).toBe(false)
    })

    describe('when initialized', () => {
      beforeEach(async () => {
        await mode.init()
        mocks.dmd.fadeIn.mockClear()
        mocks.dmd.fadeOut.mockClear()
      })

      afterEach(() => {
        if (mode.isStarted()) mode.stop()
      })

      it('shows the HUD then starts the main music', async () => {
        vi.useFakeTimers()

        expect(mode.start(1)).toBe(true)
        await vi.advanceTimersByTimeAsync(1000)

        expect(mocks.dmd.fadeOut).toHaveBeenCalledWith(150)
        expect(hud().setVisibility).toHaveBeenCalledWith(true)
        expect(mocks.dmd.fadeIn).toHaveBeenCalledWith(150)
        expect(mocks.audio.addSound).toHaveBeenCalledWith('main', expect.anything())
        expect(mocks.audio.playSound).toHaveBeenCalledWith('main', 'main-music', true)
      })

      it('does not show the HUD while the DMD is not fully visible', () => {
        mocks.dmd.brightness = 0.5

        mode.start(1)

        expect(mocks.dmd.fadeOut).not.toHaveBeenCalled()
      })

      it('logs an error when the main music fails to load', async () => {
        const error = new Error('404')
        mocks.resources.getMusic.mockReturnValue({load: () => Promise.reject(error)})

        mode.start(1)

        await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('getMusic("main").load() failed', error))
        expect(mocks.audio.playSound).not.toHaveBeenCalled()
      })

      it('logs an error when the HUD transition fails', async () => {
        const error = new Error('fade failed')
        mocks.dmd.fadeOut.mockRejectedValue(error)

        mode.start(1)

        await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('Failed to show game HUD', error))
      })

      it('stop() stops the music and hides the HUD', () => {
        mode.start(1)
        mode.stop()

        expect(mocks.audio.stopSound).toHaveBeenCalledWith('main-music')
        expect(hud().setVisibility).toHaveBeenLastCalledWith(false)
      })
    })
  })
})
