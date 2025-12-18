const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

dotenv.config();

const PORT = process.env.APP_PORT || 3000;

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; connect-src 'self' ws://localhost:3000"
    );
    next();
});


const simulations = new Map(); //현재 세션 저장
const userSockets = new Map(); // 현재 유저 저장

wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch (e) {
            return;
        }

        if (msg.type == "phonton") {
            const session = simulations.get(msg.session_id);

            session.phontons.push(...msg.data); //세션에 데이터 저장

            const target_socket = userSockets.get(session.target);
            if (target_socket) {
                target_socket.send(JSON.stringify({
                    type: "phonton",
                    session_id: msg.session_id,
                    data: msg.data
                }));
            }

        } else if (msg.type == "register") { //유저 등록
            ws.user_id = msg.user_id;
            userSockets.set(msg.user_id, ws);
        } else if (msg.type == "basis") {
            const session = simulations.get(msg.session_id);

            let target, type;
            if (msg.target === "sender") {
                target = session.sender;
                type = "basis_sender";
            } else if (msg.target === "target") {
                target = session.target;
                type = "basis_target";
            }

            const sender_socket = userSockets.get(target);
            if (sender_socket) {
                sender_socket.send(JSON.stringify({
                    type: type,
                    session_id: msg.session_id,
                    data: msg.basis
                }))
            }
        } else if (msg.type == "general") {
            const session = simulations.get(msg.session_id);
            const target_socket = userSockets.get(session.target);
            if (target_socket) {
                target_socket.send(JSON.stringify({
                    type: "general",
                    session_id: msg.session_id,
                    data: msg.data
                }));
            }
        }
    });

    ws.on("close", () => {
        if (ws.user_id) {
            userSockets.delete(ws.user_id);
        }
    })
});

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/simulation/start", (req, res) => { //연결 세션 만들기
    const { sender, target, phonton_count } = req.body;

    if (!sender || !target || !phonton_count) return res.status(400).json({ ok: false });

    const sessionID = crypto.randomUUID();

    simulations.set(sessionID, {
        sender,
        target,
        phonton_count,
        phontons: [],
        measure: [],
        timeStamp: Date.now()
    });

    res.json({ ok: true, session_id: sessionID });
});

server.listen(PORT, () => {
    console.log(`[http://localhost:${PORT}]${PORT}번 포트에서 실행 중`)
});