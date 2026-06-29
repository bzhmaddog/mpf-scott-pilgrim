from fastapi import FastAPI
import os

app = FastAPI()

is_running = False


@app.get('/start')
def start_mpf():
    global is_running

    if not is_running:
        print('Received request to start mpf')
        os.system('cd /mpf && mpf -xt &')
        is_running = True

    return {'message': 'mpf launched'}


@app.get('/stop')
def stop_mpf():
    global is_running

    if is_running:
        print('Received request to stop mpf')
        os.system('pkill mpf')
        is_running = False

    return {'message': 'mpf stopped'}


def main() -> None:
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5000)


if __name__ == '__main__':
    main()
