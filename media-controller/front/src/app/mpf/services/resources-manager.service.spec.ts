/// <reference types="vitest/globals" />
import {TestBed} from '@angular/core/testing';
import {ResourcesManager} from './resources-manager.service';
import {IResourcesManagerConfig} from '@mpf/models';
import {provideResourcesManager} from '@mpf/services';
import {AudioResource} from '@mpf/resources/audio-resource';
import {VideoResource} from '@mpf/resources/video-resource';
import {ImageResource} from '@mpf/resources/image-resource';
import {FontResource} from '@mpf/resources/font-resource';

const emptyResourcesJson = {
  strings: { 'en-US': { greeting: 'Hello' } },
  musics: [],
  sounds: [],
  videos: [],
  images: [],
  fonts: []
};

const fullResourcesJson = {
  strings: { 'en-US': { greeting: 'Hello', playerText: 'Player' } },
  musics:  [{ key: 'main',  url: 'main.mp3',  preload: false, group: 'audio' }],
  sounds:  [{ key: 'ding',  url: 'ding.mp3',  preload: false, group: 'audio' },
            { key: 'dong',  url: 'dong.mp3',  preload: false }],
  videos:  [{ key: 'intro', url: 'intro.mp4', preload: false }],
  images:  [{ key: 'logo',  url: 'logo.png',  preload: false }],
  fonts:   [{ key: 'Dusty', url: 'dusty.woff2', preload: false }],
};

const mockConfig: IResourcesManagerConfig = {
  data: emptyResourcesJson,
  basePath: '/assets/',
  locale: 'en-US'
};

describe('ResourcesManager', () => {
  let service: ResourcesManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideResourcesManager(mockConfig),
        ResourcesManager,
      ]
    });
    service = TestBed.inject(ResourcesManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getBasePath() should append trailing slash if missing', () => {
    expect(service.getBasePath()).toBe('/assets/');
  });

  it('getBasePath() should not double trailing slash', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideResourcesManager({ data: emptyResourcesJson, basePath: '/assets' }),
        ResourcesManager,
      ]
    });
    const svc = TestBed.inject(ResourcesManager);
    expect(svc.getBasePath()).toBe('/assets/');
  });

  it('should throw if resources not loaded before accessing them', () => {
    expect(() => service.getString('greeting')).toThrow('Resources are not loaded');
    expect(() => service.getMusic('key')).toThrow('Resources are not loaded');
    expect(() => service.getSound('key')).toThrow('Resources are not loaded');
    expect(() => service.getImage('key')).toThrow('Resources are not loaded');
    expect(() => service.getVideo('key')).toThrow('Resources are not loaded');
    expect(() => service.getFont('key')).toThrow('Resources are not loaded');
  });

  describe('load()', () => {
    it('should load resources and resolve', async () => {
      await expect(service.load()).resolves.toBe(service);
    });

    it('should return string after load', async () => {
      await service.load();
      expect(service.getString('greeting')).toBe('Hello');
    });

    it('should return fallback message for unknown string key', async () => {
      await service.load();
      expect(service.getString('unknown')).toBe('String unknown not found');
    });
  });

  describe('load() with resources', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideResourcesManager({ data: fullResourcesJson, basePath: '/assets/' }),
          ResourcesManager,
        ]
      });
      service = TestBed.inject(ResourcesManager);
    });

    it('should register all resource types', async () => {
      await service.load();
      expect(service.getMusic('main')).toBeInstanceOf(AudioResource);
      expect(service.getSound('ding')).toBeInstanceOf(AudioResource);
      expect(service.getVideo('intro')).toBeInstanceOf(VideoResource);
      expect(service.getImage('logo')).toBeInstanceOf(ImageResource);
      expect(service.getFont('Dusty')).toBeInstanceOf(FontResource);
    });

    it('should build correct resource URLs', async () => {
      await service.load();
      expect(service.getMusic('main').url).toBe('/assets/audio/musics/main.mp3');
      expect(service.getSound('ding').url).toBe('/assets/audio/sounds/ding.mp3');
      expect(service.getVideo('intro').url).toBe('/assets/videos/intro.mp4');
      expect(service.getImage('logo').url).toBe('/assets/images/logo.png');
      expect(service.getFont('Dusty').url).toBe('/assets/fonts/dusty.woff2');
    });

    it('should preload=false on resources when not specified', async () => {
      await service.load();
      expect(service.getMusic('main').preload).toBe(false);
    });
  });

  describe('load() with preload:true resources', () => {
    const preloadJson = {
      strings: { 'en-US': {} },
      musics:  [{ key: 'bg',    url: 'bg.mp3',    preload: true }],
      sounds:  [{ key: 'coin',  url: 'coin.mp3',  preload: true }],
      videos:  [],
      images:  [{ key: 'bg',    url: 'bg.png',    preload: true }],
      fonts:   [],
    };

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideResourcesManager({ data: preloadJson, basePath: '/assets/' }),
          ResourcesManager,
        ]
      });
      service = TestBed.inject(ResourcesManager);
      vi.spyOn(AudioResource.prototype, 'load').mockResolvedValue({} as AudioBuffer);
      vi.spyOn(ImageResource.prototype, 'load').mockResolvedValue({} as ImageBitmap);
    });

    it('should call load() on preload:true resources', async () => {
      await service.load();
      expect(AudioResource.prototype.load).toHaveBeenCalledTimes(2); // bg + coin
      expect(ImageResource.prototype.load).toHaveBeenCalledTimes(1);
    });

    it('should reject if a preload fails', async () => {
      vi.spyOn(AudioResource.prototype, 'load').mockRejectedValue(new Error('preload failed'));
      await expect(service.load()).rejects.toThrow('preload failed');
    });
  });
});
