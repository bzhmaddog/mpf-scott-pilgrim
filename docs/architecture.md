# Architecture

## Container topology

```mermaid
graph TB
    Browser(["Browser"])

    subgraph proxy_box ["mc-proxy — net: mc-front, mc-back"]
        Proxy["nginx<br/>:4443 HTTPS"]
    end

    subgraph front_box ["mc-front — net: mc-front"]
        Front["nginx<br/>Angular app · :4200"]
    end

    subgraph back_box ["mc-back — net: mc-back"]
        Back["Node.js<br/>WS :5000 · BCP :5050"]
    end

    subgraph mpf_box ["mpf — net: mc-back"]
        MPF["MPF + FastAPI<br/>HTTP :5000"]
    end

    Browser -->|HTTPS| Proxy
    Proxy -->|HTTP| Front
    Proxy -->|WS upgrade| Back
    Back -->|start / stop| MPF
    MPF -->|BCP| Back
```

> `mc-proxy` is on both networks (`mc-front` and `mc-back`). `mc-front` and `mc-back` are fully isolated from each other.

## Request flow

```mermaid
sequenceDiagram
    participant Browser
    participant Proxy as mc-proxy (nginx)
    participant Front as mc-front (nginx)
    participant Back as mc-back (Node.js)
    participant MPF as mpf (MPF + FastAPI)

    Browser->>Proxy: HTTPS GET /
    Proxy->>Front: HTTP GET /
    Front-->>Browser: Angular app (HTML/JS)

    Browser->>Proxy: WSS /ws (upgrade)
    Proxy->>Back: WS /ws (upgrade)
    Note over Back: clientConnected event

    Back->>MPF: HTTP GET /stop
    MPF-->>Back: 200
    Back->>MPF: HTTP GET /start (after 100ms)
    MPF-->>Back: 200
    Note over MPF: spawns mpf process

    MPF->>Back: BCP TCP connect → :5050
    Back-->>MPF: set_machine_var, monitor_start…
    MPF-->>Back: hello
    Back-->>Browser: mc_hello (WS)

    MPF-->>Back: reset
    Back-->>Browser: mc_reset (WS)
    Browser-->>Back: mc_ready (WS)
    Back-->>MPF: reset_complete (BCP)

    loop Game running
        MPF-->>Back: BCP event
        Back-->>Browser: mc_* (WS)
        Browser-->>Back: command (WS)
        Back-->>MPF: BCP command
    end

    MPF-->>Back: goodbye
    Back-->>Browser: mc_goodbye (WS)
```

## mc-back internal design

```mermaid
graph LR
    MPF_BCP(["MPF\nTCP :5050"])
    MPF_HTTP(["MPF HTTP\n:5000"])
    Browser(["Browser / DMD"])

    subgraph back_container ["mc-back container (:5000)"]
        direction LR
        index["index.ts\nevent bridge"]

        subgraph servers ["Servers"]
            BcpServer["BcpServer\nEventEmitter"]
            WsServer["WsServer\nEventEmitter"]
        end

        subgraph helpers ["Helpers"]
            Keyboard["Keyboard"]
            MpfController["MpfController"]
        end
    end

    MPF_BCP   <-->|"BCP protocol"| BcpServer
    Browser   <-->|"WebSocket :5000"| WsServer

    BcpServer -->|"broadcast\nreset / goodbye\nconnected"| index
    WsServer  -->|"bcpMessage\nready / keyboard\nclientConnected"| index

    index -->|"send()"| BcpServer
    index -->|"broadcast()"| WsServer
    index -->|"onKeyPressed()"| Keyboard
    Keyboard -->|"switch msg callback"| index

    index         -->|"stop() / start()"| MpfController
    MpfController -->|"HTTP GET /stop\nHTTP GET /start"| MPF_HTTP
```

### mc-back class diagram

```mermaid
classDiagram
    class BcpServer {
        -tcpSocket: Socket
        -server: net.Server
        +send(message) void
        -sendInitMessages() void
        -handleData(chunk) void
        -handleMessage(command, params) void
        emit connected
        emit disconnected
        emit broadcast
        emit reset
        emit goodbye
    }

    class WsServer {
        -clients: WebSocket[]
        -httpServer: http.Server
        -wss: WebSocketServer
        +broadcast(message) void
        +clientCount: number
        -handleMessage(message) void
        emit clientConnected
        emit clientDisconnected
        emit ready
        emit keyboard
        emit bcpMessage
    }

    class Keyboard {
        +keys: Record~string, KeyboardKey~
        +onKeyPressed(key, bcpSend) void
        +resetToggleStates() void
    }

    class MpfController {
        +start(onError)$ void
        +stop(onCompleted, onError)$ void
    }

    EventEmitter <|-- BcpServer
    EventEmitter <|-- WsServer
```
