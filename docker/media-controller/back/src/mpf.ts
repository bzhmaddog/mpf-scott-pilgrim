import http from 'node:http';

export class MpfController {
    static start(onError: () => void): void {
        http.get({
            hostname: 'mpf',
            port: 5000,
            path: '/start',
            agent: false,
        }, (response) => {
            if (response.statusCode !== 200) onError();
        });
    }

    static stop(onCompleted: () => void, onError: () => void): void {
        http.get({
            hostname: 'mpf',
            port: 5000,
            path: '/stop',
            agent: false,
        }, (response) => {
            if (response.statusCode !== 200) {
                onError();
            } else {
                onCompleted();
            }
        }).on('error', onCompleted);
    }
}
