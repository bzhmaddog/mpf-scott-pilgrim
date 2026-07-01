/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { Logger } from '@utils/logger';
import { AudioResource } from './audio-resource';
import { FontResource } from './font-resource';
import { ImageResource } from './image-resource';
import { VideoResource } from './video-resource';

// Ensure Logger.instance is set before any resource logger singleton is touched
beforeAll(() => {
  TestBed.configureTestingModule({});
  TestBed.inject(Logger);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Base class (tested via AudioResource, no load() call needed) ───────────
describe('Resource base class', () => {
  it('exposes url, preload and isLoaded', () => {
    const r = new AudioResource('test.mp3', true);
    expect(r.url).toBe('test.mp3');
    expect(r.preload).toBe(true);
    expect(r.isLoaded).toBe(false);
  });

  it('resource getter throws when not loaded', () => {
    const r = new AudioResource('test.mp3', false);
    expect(() => r.resource).toThrow('test.mp3');
  });
});

// ── AudioResource ──────────────────────────────────────────────────────────
describe('AudioResource', () => {
  const mockBuffer = {} as AudioBuffer;
  const mockDecodeAudioData = vi.fn();

  // Use a class so `new AudioContext()` works as a constructor
  class MockAudioContext {
    decodeAudioData = mockDecodeAudioData;
  }

  // Stub AudioContext once so the module-level singleton picks it up on first use
  beforeAll(() => {
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    mockDecodeAudioData.mockResolvedValue(mockBuffer);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    }));
  });

  it('resolves with AudioBuffer on success', async () => {
    const r = new AudioResource('test.mp3', false);
    const result = await r.load();
    expect(result).toBe(mockBuffer);
    expect(r.isLoaded).toBe(true);
    expect(r.resource).toBe(mockBuffer);
  });

  it('load() returns cached result without re-fetching', async () => {
    const r = new AudioResource('test.mp3', false);
    await r.load();
    await r.load();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('rejects on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const r = new AudioResource('fail.mp3', false);
    await expect(r.load()).rejects.toThrow('network error');
    expect(r.isLoaded).toBe(false);
  });

  it('rejects on decodeAudioData failure', async () => {
    mockDecodeAudioData.mockRejectedValueOnce(new Error('decode error'));
    const r = new AudioResource('bad.mp3', false);
    await expect(r.load()).rejects.toThrow('decode error');
    expect(r.isLoaded).toBe(false);
  });
});

// ── ImageResource ──────────────────────────────────────────────────────────
describe('ImageResource', () => {
  it('resolves with ImageBitmap on success', async () => {
    const mockBitmap = {} as ImageBitmap;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) }));
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap));

    const r = new ImageResource('test.png', false);
    const result = await r.load();
    expect(result).toBe(mockBitmap);
    expect(r.isLoaded).toBe(true);
  });

  it('rejects on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('img error')));
    const r = new ImageResource('fail.png', false);
    await expect(r.load()).rejects.toThrow('img error');
    expect(r.isLoaded).toBe(false);
  });
});

// ── VideoResource ──────────────────────────────────────────────────────────
describe('VideoResource', () => {
  let eventListeners: Record<string, (e: Event) => void>;
  let mockVideo: Record<string, unknown>;

  beforeEach(() => {
    eventListeners = {};
    mockVideo = {
      src: '',
      addEventListener: vi.fn((event: string, cb: (e: Event) => void) => {
        eventListeners[event] = cb;
      }),
      removeEventListener: vi.fn(),
      load: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement);
  });

  it('resolves with the video element when loadeddata fires', async () => {
    const r = new VideoResource('test.mp4', false);
    const promise = r.load();
    eventListeners['loadeddata'](new Event('loadeddata'));
    const result = await promise;
    expect(result).toBe(mockVideo);
    expect(r.isLoaded).toBe(true);
    expect(r.resource).toBe(mockVideo);
  });

  it('rejects and removes listeners when error fires', async () => {
    const r = new VideoResource('fail.mp4', false);
    const promise = r.load();
    eventListeners['error'](new Event('error'));
    await expect(promise).rejects.toThrow();
    expect(r.isLoaded).toBe(false);
    expect(mockVideo['removeEventListener']).toHaveBeenCalledTimes(2);
  });
});

// ── FontResource ───────────────────────────────────────────────────────────
describe('FontResource', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'fonts', {
      value: { add: vi.fn() },
      configurable: true,
      writable: true,
    });
  });

  it('resolves with FontFace on success', async () => {
    // FontFace.load() resolves with the FontFace instance itself
    vi.stubGlobal('FontFace', function MockFontFace(this: { load?: unknown }) {
      this.load = vi.fn().mockImplementation(() => Promise.resolve(this));
    });

    const r = new FontResource('Dusty', 'dusty.woff2', false);
    const result = await r.load();
    expect(result).toBeDefined();
    expect(r.isLoaded).toBe(true);
    expect(r.resource).toBe(result);
    vi.unstubAllGlobals();
  });

  it('rejects on load failure', async () => {
    const mockLoad = vi.fn().mockRejectedValue(new Error('font error'));
    vi.stubGlobal('FontFace', function MockFontFace(this: { load?: unknown }) {
      this.load = mockLoad;
    });

    const r = new FontResource('Dusty', 'fail.woff2', false);
    await expect(r.load()).rejects.toThrow('font error');
    expect(r.isLoaded).toBe(false);
    vi.unstubAllGlobals();
  });
});
