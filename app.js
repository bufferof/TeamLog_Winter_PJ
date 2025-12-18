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

const simulations = new Map(); 
const userSockets = new Map(); 

wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch (e) {
            
            return;
        }

        

        if (msg.type === "phonton") {
            
            
            
            
            const session = simulations.get(msg.session_id);
            
            if (!session) {
                
                
                ws.send(JSON.stringify({
                    type: "error",
                    message: "세션을 찾을 수 없습니다",
                    session_id: msg.session_id
                }));
                return;
            }

            session.phontons.push(...msg.data);
            const target_socket = userSockets.get(session.target);
            
            if (target_socket && target_socket.readyState === WebSocket.OPEN) {
                target_socket.send(JSON.stringify({
                    type: "phonton",
                    session_id: msg.session_id,
                    data: msg.data
                }));
                
            } else {
                
            }

        } else if (msg.type === "register") {
            
            ws.user_id = msg.user_id;
            userSockets.set(msg.user_id, ws);
            

        } else if (msg.type === "basis") {
            
            
            
            const session = simulations.get(msg.session_id);
            
            if (!session) {
                
                
                ws.send(JSON.stringify({
                    type: "error",
                    message: "세션을 찾을 수 없습니다",
                    session_id: msg.session_id
                }));
                return;
            }

            let target, type;
            
            if (msg.target === "sender") {
                target = session.sender;
                type = "basis_sender";
            } else if (msg.target === "target") {
                target = session.target;
                type = "basis_target";
            }

            const target_socket = userSockets.get(target);
            
            if (target_socket && target_socket.readyState === WebSocket.OPEN) {
                target_socket.send(JSON.stringify({
                    type: type,
                    session_id: msg.session_id,
                    basis: msg.basis,
                    data: msg.data
                }));
                
            } else {
                
            }

        } else if (msg.type === "verify_sample") {
            
            
            
            const session = simulations.get(msg.session_id);
            
            if (!session) {
                
                
                ws.send(JSON.stringify({
                    type: "error",
                    message: "세션을 찾을 수 없습니다",
                    session_id: msg.session_id
                }));
                return;
            }

            
            session.verify_data = {
                sample_indices: msg.sample_indices,
                sample_bits: msg.sample_bits,
                matching_indices: msg.matching_indices,
                timestamp: Date.now()
            };

            const target_socket = userSockets.get(session.target);
            
            if (target_socket && target_socket.readyState === WebSocket.OPEN) {
                target_socket.send(JSON.stringify({
                    type: "verify_sample",
                    session_id: msg.session_id,
                    sample_indices: msg.sample_indices,
                    sample_bits: msg.sample_bits,
                    matching_indices: msg.matching_indices
                }));
                
                
            } else {
                
            }

        } else if (msg.type === "verify_result") {
            
            
            
            const session = simulations.get(msg.session_id);
            
            if (!session) {
                
                
                ws.send(JSON.stringify({
                    type: "error",
                    message: "세션을 찾을 수 없습니다",
                    session_id: msg.session_id
                }));
                return;
            }

            
            session.verify_result = {
                success: msg.success,
                error_rate: msg.error_rate,
                final_key_length: msg.final_key_length,
                timestamp: Date.now()
            };

            const sender_socket = userSockets.get(session.sender);
            
            if (sender_socket && sender_socket.readyState === WebSocket.OPEN) {
                sender_socket.send(JSON.stringify({
                    type: "verify_result",
                    session_id: msg.session_id,
                    success: msg.success,
                    error_rate: msg.error_rate,
                    final_key_length: msg.final_key_length,
                    sample_indices: session.verify_data?.sample_indices
                }));
                
                if (msg.success) {
                    
                    
                    session.status = 'active'; 
                } else {
                    
                    
                    
                    session.status = 'failed'; 
                    
                    
                    setTimeout(() => {
                        simulations.delete(msg.session_id);
                        
                    }, 5000);
                }
            } else {
                
            }

        } else if (msg.type === "general") {
            
            
            
            const session = simulations.get(msg.session_id);
            
            if (!session) {
                
                
                ws.send(JSON.stringify({
                    type: "error",
                    message: "세션을 찾을 수 없습니다",
                    session_id: msg.session_id
                }));
                return;
            }

            
            if (session.status !== 'active') {
                
                return;
            }

            const target_socket = userSockets.get(session.target);
            
            if (target_socket && target_socket.readyState === WebSocket.OPEN) {
                target_socket.send(JSON.stringify({
                    type: "general",
                    session_id: msg.session_id,
                    data: msg.data,
                    message_length: msg.message_length 
                }));
                
            } else {
                
            }
        }
    });

    ws.on("close", () => {
        if (ws.user_id) {
            
            userSockets.delete(ws.user_id);
            
            
            for (const [sessionId, session] of simulations.entries()) {
                if (session.sender === ws.user_id || session.target === ws.user_id) {
                    
                    simulations.delete(sessionId);
                }
            }
        }
    });

    ws.on("error", (error) => {
        
    });
});

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/simulation/start", (req, res) => {
    
    const { sender, target, phonton_count } = req.body;
    
    if (!sender || !target || !phonton_count) {
        
        return res.status(400).json({ ok: false, error: "필수 파라미터 누락" });
    }

    const sessionID = crypto.randomUUID();
    
    simulations.set(sessionID, {
        sender,
        target,
        phonton_count,
        phontons: [],
        measure: [],
        status: 'pending', 
        timeStamp: Date.now()
    });

    

    res.json({ ok: true, session_id: sessionID });
});


app.get("/simulation/status/:session_id", (req, res) => {
    const session = simulations.get(req.params.session_id);
    
    if (!session) {
        return res.status(404).json({ ok: false, error: "세션을 찾을 수 없음" });
    }

    res.json({
        ok: true,
        session: {
            id: req.params.session_id,
            sender: session.sender,
            target: session.target,
            status: session.status,
            phonton_count: session.phonton_count,
            verify_result: session.verify_result,
            timestamp: session.timeStamp
        }
    });
});


app.get("/simulation/list", (req, res) => {
    const sessions = [];
    
    for (const [sessionId, session] of simulations.entries()) {
        sessions.push({
            id: sessionId,
            sender: session.sender,
            target: session.target,
            status: session.status,
            timestamp: session.timeStamp
        });
    }

    res.json({ ok: true, sessions });
});


setInterval(() => {
    const now = Date.now();
    const MAX_AGE = 10 * 60 * 1000; 
    
    for (const [sessionId, session] of simulations.entries()) {
        if (now - session.timeStamp > MAX_AGE) {
            
            simulations.delete(sessionId);
        }
    }
}, 10 * 60 * 1000);

server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}에서 실행중`);
});