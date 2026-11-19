/// <reference types="vitest/globals" />
import {TestBed} from '@angular/core/testing';
import {Mock} from 'vitest';
import {MpfApp} from './mpf-app';
import {makeMockLayer, makeMpfMocks, MpfMocks, provideMpfMocks} from './testing/mpf-mocks';

/** Private members exercised by these tests */
interface MpfAppInternals {
  _wsServer: { send(msg: string): void; isConnected(): boolean }
  _wsOnMessage(cmd: string, params: Record<string, string>, raw: unknown): void
  _wsOnClose(): void
  _reset(): void
  _resetDMD(): Promise<void>
  _showToast(text: string, duration?: number): void
  _fadeLayer(...args: unknown[]): Promise<void>
  _fadeIn(): void
}

describe('MpfApp', () => {
  let mocks: MpfMocks
  let app: MpfAppInternals
  let send: Mock<(msg: string) => void>

  const createApp = () => {
    TestBed.configureTestingModule({providers: provideMpfMocks(mocks)})
    const instance = TestBed.runInInjectionContext(() => new MpfApp(document.createElement('canvas')))
    app = instance as unknown as MpfAppInternals
    send = vi.fn<(msg: string) => void>()
    app._wsServer.send = send
  }

  beforeEach(() => {
    mocks = makeMpfMocks()
    createApp()
  })

  describe('mc_reset', () => {
    it('hides the logo, initializes all modes then tells MPF it is ready', async () => {
      app._wsOnMessage('mc_reset', {}, '')

      await vi.waitFor(() => expect(send).toHaveBeenCalledWith('mc_ready'))
      expect(mocks.dmd.fadeOut).toHaveBeenCalledWith(150)
      expect(mocks.dmd.removeLayer).toHaveBeenCalledWith('logo')
      expect(mocks.dmd.fadeIn).toHaveBeenCalledWith(150)
      expect(mocks.modes.initAll).toHaveBeenCalled()
      expect(mocks.audio.reset).toHaveBeenCalled()
    })

    it('waits for the modes to be initialized before sending mc_ready', async () => {
      let finishInit!: () => void
      mocks.modes.initAll.mockReturnValue(new Promise<void>(resolve => finishInit = resolve))

      app._wsOnMessage('mc_reset', {}, '')
      await vi.waitFor(() => expect(mocks.modes.initAll).toHaveBeenCalled())
      expect(send).not.toHaveBeenCalled()

      finishInit()
      await vi.waitFor(() => expect(send).toHaveBeenCalledWith('mc_ready'))
    })

    it('logs an error instead of an unhandled rejection when the reset fails', async () => {
      const error = new Error('fade failed')
      mocks.dmd.fadeOut.mockRejectedValue(error)

      app._wsOnMessage('mc_reset', {}, '')

      await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('MPF reset handling failed', error))
      expect(send).not.toHaveBeenCalled()
    })
  })

  describe('DMD reset', () => {
    it('mc_goodbye resets the DMD with the logo and toast layers then fades in', async () => {
      app._wsOnMessage('mc_goodbye', {}, '')

      expect(mocks.dmd.reset).toHaveBeenCalled()
      const layerNames = mocks.dmd.addLayer.mock.calls.map(call => call[1])
      expect(layerNames).toEqual(['logo', 'ws-toast'])
      await vi.waitFor(() => expect(mocks.dmd.fadeIn).toHaveBeenCalledWith(1000))
      expect(mocks.dmd.layer.drawBitmap).toHaveBeenCalled()
    })

    it('mc_goodbye logs an error when the reset fails', async () => {
      const error = new Error('reset failed')
      mocks.dmd.reset.mockImplementation(() => { throw error })

      app._wsOnMessage('mc_goodbye', {}, '')

      await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('DMD reset failed', error))
    })

    it('closing a connected socket resets the DMD and shows a toast', async () => {
      const toast = makeMockLayer()
      mocks.dmd.getLayer.mockReturnValue(toast)
      app._wsServer.isConnected = () => true
      const error = new Error('reset failed')
      mocks.dmd.reset.mockImplementation(() => { throw error })

      app._wsOnClose()

      expect(toast.setText).toHaveBeenCalledWith('Disconnected...')
      await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('DMD reset failed', error))
    })

    it('closing a disconnected socket does nothing', () => {
      app._wsServer.isConnected = () => false
      app._wsOnClose()
      expect(mocks.dmd.reset).not.toHaveBeenCalled()
    })

    it('_fadeIn logs an error when the DMD fade fails', async () => {
      const error = new Error('fade failed')
      mocks.dmd.fadeIn.mockRejectedValue(error)

      app._fadeIn()

      await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('DMD fade in failed', error))
    })
  })

  describe('_reset', () => {
    it('re-initializes all modes after the DMD reset', async () => {
      app._reset()

      expect(mocks.audio.reset).toHaveBeenCalled()
      await vi.waitFor(() => expect(mocks.modes.initAll).toHaveBeenCalled())
    })

    it('logs an error when the reset fails', async () => {
      const error = new Error('init failed')
      mocks.modes.initAll.mockRejectedValue(error)

      app._reset()

      await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('App reset failed', error))
    })
  })

  describe('_showToast', () => {
    it('fades the toast in, waits, fades it out then hides it', async () => {
      const toast = makeMockLayer()
      mocks.dmd.getLayer.mockReturnValue(toast)
      const fade = vi.spyOn(app, '_fadeLayer').mockResolvedValue()

      app._showToast('Hello', 0)

      expect(toast.setText).toHaveBeenCalledWith('Hello')
      expect(toast.setVisibility).toHaveBeenCalledWith(true)
      await vi.waitFor(() => expect(toast.setVisibility).toHaveBeenLastCalledWith(false))
      expect(fade).toHaveBeenNthCalledWith(1, toast, 0, 1, 300)
      expect(fade).toHaveBeenNthCalledWith(2, toast, 1, 0, 300)
    })

    it('logs an error when the animation fails', async () => {
      const toast = makeMockLayer()
      mocks.dmd.getLayer.mockReturnValue(toast)
      const error = new Error('animation failed')
      vi.spyOn(app, '_fadeLayer').mockRejectedValue(error)

      app._showToast('Hello', 0)

      await vi.waitFor(() => expect(mocks.logger.error).toHaveBeenCalledWith('Toast animation failed', error))
    })

    it('does nothing when the toast layer does not exist', () => {
      const fade = vi.spyOn(app, '_fadeLayer')
      app._showToast('Hello')
      expect(fade).not.toHaveBeenCalled()
    })
  })
})
