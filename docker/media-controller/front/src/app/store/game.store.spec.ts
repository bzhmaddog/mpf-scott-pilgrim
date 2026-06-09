/// <reference types="vitest/globals" />
import {TestBed} from '@angular/core/testing';
import {GameStore, initialState} from './game.store';

describe('GameStore', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GameStore);
  });

  it('should have initial state', () => {
    expect(store.players()).toEqual(initialState.players);
    expect(store.player()).toBe(initialState.player);
    expect(store.variables()).toEqual(initialState.variables);
    expect(store.settings()).toEqual(initialState.settings);
  });

  describe('setMachineVariable', () => {
    it('should set a machine variable', () => {
      store.setMachineVariable('score_display', '1000');
      expect(store.variables()['score_display']).toBe('1000');
    });

    it('should not overwrite other variables', () => {
      store.setMachineVariable('a', '1');
      store.setMachineVariable('b', '2');
      expect(store.variables()['a']).toBe('1');
      expect(store.variables()['b']).toBe('2');
    });
  });

  describe('addPlayer', () => {
    it('should add a player with default ball and score', () => {
      store.addPlayer();
      expect(store.players().length).toBe(1);
      expect(store.players()[0]).toEqual({ball: 0, score: 0});
    });

    it('should add multiple players', () => {
      store.addPlayer();
      store.addPlayer();
      expect(store.players().length).toBe(2);
    });
  });

  describe('setCurrentPlayer', () => {
    it('should set the current player', () => {
      store.setCurrentPlayer(1);
      expect(store.player()).toBe(1);
    });

    it('should not set player below 1', () => {
      store.setCurrentPlayer(1);
      store.setCurrentPlayer(0);
      expect(store.player()).toBe(1);
    });
  });

  describe('setCurrentBall', () => {
    beforeEach(() => {
      store.addPlayer();
      store.setCurrentPlayer(1);
    });

    it('should set ball for current player', () => {
      store.setCurrentBall(2);
      expect(store.players()[0].ball).toBe(2);
    });

    it('should not set ball below 1', () => {
      store.setCurrentBall(1);
      store.setCurrentBall(0);
      expect(store.players()[0].ball).toBe(1);
    });
  });

  describe('setCurrentScore', () => {
    beforeEach(() => {
      store.addPlayer();
      store.setCurrentPlayer(1);
    });

    it('should set score for current player', () => {
      store.setCurrentScore(5000);
      expect(store.players()[0].score).toBe(5000);
    });

    it('should prevent negative score', () => {
      store.setCurrentScore(-100);
      expect(store.players()[0].score).toBe(0);
    });
  });

  describe('setPlayerBall', () => {
    beforeEach(() => {
      store.addPlayer();
      store.addPlayer();
    });

    it('should set ball for a specific player', () => {
      store.setPlayerBall(2, 3);
      expect(store.players()[1].ball).toBe(3);
    });

    it('should not mutate other players', () => {
      store.setPlayerBall(2, 3);
      expect(store.players()[0].ball).toBe(0);
    });
  });

  describe('setPlayerScore', () => {
    beforeEach(() => {
      store.addPlayer();
      store.addPlayer();
    });

    it('should set score for a specific player', () => {
      store.setPlayerScore(1, 9999);
      expect(store.players()[0].score).toBe(9999);
    });

    it('should not mutate other players', () => {
      store.setPlayerScore(1, 9999);
      expect(store.players()[1].score).toBe(0);
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      store.addPlayer();
      store.addPlayer();
      store.setCurrentPlayer(1);
      store.setCurrentScore(1234);
      store.setCurrentBall(2);
    });

    it('currentPlayerState should return current player', () => {
      expect(store.currentPlayerState()).toEqual({score: 1234, ball: 2});
    });

    it('currentPlayerScore should return current player score', () => {
      expect(store.currentPlayerScore()).toBe(1234);
    });

    it('currentPlayerBall should return current player ball', () => {
      expect(store.currentPlayerBall()).toBe(2);
    });

    it('currentPlayerScore should return 0 when player index is out of bounds', () => {
      // beforeEach adds only 2 players; player 99 does not exist in the array
      store.setCurrentPlayer(99);
      expect(store.currentPlayerScore()).toBe(0);
    });

    it('currentPlayerBall should return 0 when player index is out of bounds', () => {
      // beforeEach adds only 2 players; player 99 does not exist in the array
      store.setCurrentPlayer(99);
      expect(store.currentPlayerBall()).toBe(0);
    });
  });
});
