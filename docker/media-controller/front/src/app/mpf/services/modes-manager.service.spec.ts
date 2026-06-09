/// <reference types="vitest/globals" />
import {TestBed} from '@angular/core/testing';
import {ModesManager, IModesConfigDictionary} from './modes-manager.service';
import {provideModesManager} from '@mpf/services';
import {Mode} from '@mpf/modes/mode';

const makeMockMode = (name: string): Mode => ({
  start: vi.fn().mockReturnValue(true),
  stop: vi.fn(),
  init: vi.fn(),
  isStarted: vi.fn().mockReturnValue(false),
  isInitialized: vi.fn().mockReturnValue(true),
  name,
  priority: 0,
} as unknown as Mode);

const mockModesConfig: IModesConfigDictionary = {
  attract: () => makeMockMode('attract'),
  game: () => makeMockMode('game'),
};

describe('ModesManager', () => {
  let service: ModesManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideModesManager(mockModesConfig),
        ModesManager,
      ]
    });
    service = TestBed.inject(ModesManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should instantiate all provided modes', () => {
    expect(service.getMode('attract')).toBeTruthy();
    expect(service.getMode('game')).toBeTruthy();
  });

  it('getMode() should return undefined for unknown mode', () => {
    expect(service.getMode('unknown')).toBeUndefined();
  });

  it('activeMode should be undefined initially', () => {
    expect(service.activeMode).toBeUndefined();
  });

  describe('startMode()', () => {
    beforeEach(() => service.initAll());

    it('should set active mode', () => {
      service.startMode('attract', 10);
      expect(service.activeMode).toBeTruthy();
    });

    it('should not crash for unknown mode', () => {
      expect(() => service.startMode('unknown', 10)).not.toThrow();
    });
  });

  describe('stopMode()', () => {
    beforeEach(() => service.initAll());

    it('should not crash for unknown mode', () => {
      expect(() => service.stopMode('unknown')).not.toThrow();
    });
  });

  describe('stopActiveMode()', () => {
    it('should not crash when no active mode', () => {
      expect(() => service.stopActiveMode()).not.toThrow();
    });
  });

  describe('initAll()', () => {
    it('should not crash', () => {
      expect(() => service.initAll()).not.toThrow();
    });
  });
});
