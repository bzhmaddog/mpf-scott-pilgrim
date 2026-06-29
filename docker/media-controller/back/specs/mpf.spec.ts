import { describe, it, expect, vi, afterEach } from 'vitest';
import http from 'node:http';
import { MpfController } from '../src/mpf';

afterEach(() => vi.restoreAllMocks());

function mockGet(statusCode: number): void {
    vi.spyOn(http, 'get').mockImplementation(((_opts: unknown, cb: (res: { statusCode: number }) => void) => {
        cb({ statusCode });
        return { on: () => ({}) } as unknown as http.ClientRequest;
    }) as unknown as typeof http.get);
}

describe('MpfController', () => {
    it('start calls onError on non-200', () => {
        mockGet(500);
        const onError = vi.fn();
        MpfController.start(onError);
        expect(onError).toHaveBeenCalled();
    });

    it('start does not call onError on 200', () => {
        mockGet(200);
        const onError = vi.fn();
        MpfController.start(onError);
        expect(onError).not.toHaveBeenCalled();
    });

    it('stop calls onCompleted on 200', () => {
        mockGet(200);
        const onCompleted = vi.fn();
        const onError = vi.fn();
        MpfController.stop(onCompleted, onError);
        expect(onCompleted).toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });

    it('stop calls onError on non-200', () => {
        mockGet(503);
        const onCompleted = vi.fn();
        const onError = vi.fn();
        MpfController.stop(onCompleted, onError);
        expect(onError).toHaveBeenCalled();
    });
});
