from flask import Flask, request, jsonify
import os

app = Flask(__name__)

is_running = False


@app.route('/start', methods=['GET'])
def start_mpf():
    global is_running

    if not is_running:
        print("Received request to start mpf")
        os.system('cd /mpf && mpf -xt &')
        is_running = True

    return jsonify({'message': 'mpf launched'}), 200


@app.route('/stop', methods=['GET'])
def stop_mpf():
    global is_running

    if is_running:
        print("Received request to stop mpf")
        os.system('pkill mpf')
        is_running = False

    return jsonify({'message': 'mpf stopped'}), 200


if __name__ == '__main__':
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
