/// <reference types="vitest/globals" />
// Test doubles shared by the MPF specs (excluded from coverage and Sonar sources).
import {Mock} from 'vitest';
import {Provider} from '@angular/core';
import {Dmd} from 'h5dmd';
import {Logger} from '../../utils/logger';
import {ResourcesManager} from '@mpf/services/resources-manager.service';
import {AudioManager} from '@mpf/services/audio-manager.service';
import {ModesManager} from '@mpf/services/modes-manager.service';
import {DmdManagerService} from '@mpf/services/dmd-manager.service';

export interface MockLogger {
  debug: Mock
  log: Mock
  info: Mock
  warn: Mock
  error: Mock
}

export const makeMockLogger = (): MockLogger => ({
  debug: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

export interface MockLayer {
  drawBitmap: Mock
  setVideo: Mock
  setText: Mock
  setOpacity: Mock
  setVisibility: Mock
  toggleVisibility: Mock
  play: Mock
  stop: Mock
  createSprite: Mock
  enqueueSequence: Mock
  run: Mock
}

export const makeMockLayer = (): MockLayer => ({
  drawBitmap: vi.fn(),
  setVideo: vi.fn(),
  setText: vi.fn(),
  setOpacity: vi.fn(),
  setVisibility: vi.fn(),
  toggleVisibility: vi.fn(),
  play: vi.fn(),
  stop: vi.fn(),
  createSprite: vi.fn(() => Promise.resolve()),
  enqueueSequence: vi.fn(),
  run: vi.fn(),
});

type LayerCallback = (layer: MockLayer) => void

/**
 * A layer group: addLayer() returns a shared layer and immediately runs the
 * optional "on created" callback, like h5dmd does.
 */
export interface MockLayerGroup {
  layer: MockLayer
  groups: MockLayerGroup[]
  addLayer: Mock
  addLayerGroup: Mock
  setVisibility: Mock
}

export const makeMockLayerGroup = (): MockLayerGroup => {
  const group: MockLayerGroup = {
    layer: makeMockLayer(),
    groups: [],
    addLayer: vi.fn((_type: unknown, _name: string, _options?: unknown, cb?: LayerCallback) => {
      cb?.(group.layer)
      return group.layer
    }),
    addLayerGroup: vi.fn(() => {
      const child = makeMockLayerGroup()
      group.groups.push(child)
      return child
    }),
    setVisibility: vi.fn(),
  }
  return group
}

export interface MockDmd extends MockLayerGroup {
  brightness: number
  reset: Mock
  removeLayer: Mock
  getLayer: Mock
  fadeIn: Mock
  fadeOut: Mock
}

export const makeMockDmd = (): MockDmd => ({
  ...makeMockLayerGroup(),
  brightness: 1,
  reset: vi.fn(),
  removeLayer: vi.fn(),
  getLayer: vi.fn(() => null),
  fadeIn: vi.fn(() => Promise.resolve()),
  fadeOut: vi.fn(() => Promise.resolve()),
});

/** A resource whose load() resolves with `value` (or rejects with `error`). */
export const makeResource = <T>(value: T, error?: unknown) => ({
  load: vi.fn(() => (error === undefined ? Promise.resolve(value) : Promise.reject(error))),
});

export interface MockResourcesManager {
  load: Mock
  getString: Mock
  getMusic: Mock
  getSound: Mock
  getImage: Mock
  getVideo: Mock
}

/** Resources manager where every load() resolves, or rejects when `error` is given. */
export const makeMockResourcesManager = (error?: unknown): MockResourcesManager => ({
  load: vi.fn(() => Promise.resolve()),
  getString: vi.fn((key: string) => `str:${key}`),
  getMusic: vi.fn(() => makeResource({} as AudioBuffer, error)),
  getSound: vi.fn(() => makeResource({} as AudioBuffer, error)),
  getImage: vi.fn(() => makeResource({} as ImageBitmap, error)),
  getVideo: vi.fn(() => makeResource({} as HTMLVideoElement, error)),
});

export interface MockAudioManager {
  addSound: Mock
  playSound: Mock
  stopSound: Mock
  reset: Mock
}

export const makeMockAudioManager = (): MockAudioManager => ({
  addSound: vi.fn(),
  playSound: vi.fn(),
  stopSound: vi.fn(),
  reset: vi.fn(),
});

export interface MockModesManager {
  initAll: Mock
  startMode: Mock
  stopMode: Mock
}

export const makeMockModesManager = (): MockModesManager => ({
  initAll: vi.fn(() => Promise.resolve()),
  startMode: vi.fn(),
  stopMode: vi.fn(),
});

export interface MpfMocks {
  logger: MockLogger
  dmd: MockDmd
  resources: MockResourcesManager
  audio: MockAudioManager
  modes: MockModesManager
}

export const makeMpfMocks = (resourceError?: unknown): MpfMocks => ({
  logger: makeMockLogger(),
  dmd: makeMockDmd(),
  resources: makeMockResourcesManager(resourceError),
  audio: makeMockAudioManager(),
  modes: makeMockModesManager(),
});

/** TestBed providers wiring the mocks in place of the real services. */
export const provideMpfMocks = (mocks: MpfMocks): Provider[] => {
  const dmdManager = new DmdManagerService()
  dmdManager.setDmd(mocks.dmd as unknown as Dmd)
  return [
    {provide: Logger, useValue: {getInstance: () => mocks.logger}},
    {provide: DmdManagerService, useValue: dmdManager},
    {provide: ResourcesManager, useValue: mocks.resources},
    {provide: AudioManager, useValue: mocks.audio},
    {provide: ModesManager, useValue: mocks.modes},
  ]
}
