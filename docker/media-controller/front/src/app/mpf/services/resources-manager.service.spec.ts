/// <reference types="vitest/globals" />
import {TestBed} from '@angular/core/testing';
import {ResourcesManager, IResourcesManagerConfig} from './resources-manager.service';
import {provideResourcesManager, resourcesManager} from '@mpf/services';

const mockConfig: IResourcesManagerConfig = {
  file: 'resources.json',
  basePath: '/assets/',
  locale: 'en-US'
};

const mockResourcesJson = {
  strings: { 'en-US': { greeting: 'Hello' } },
  musics: [],
  sounds: [],
  videos: [],
  images: [],
  fonts: []
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
        provideResourcesManager({ file: 'resources.json', basePath: '/assets' }),
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
    beforeEach(() => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResourcesJson)
      } as Response);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

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

    it('should reject if fetch fails', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'));
      await expect(service.load()).rejects.toBeUndefined();
    });
  });
});
