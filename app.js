const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server: server});

dotenv.config();

const PORT = process.env.APP_PORT || 3000;

app.set("view engine","ejs");

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const simulations = new Map(); //현재 세션 저장
const userSockets = new Map(); // 현재 유저 저장

wss.on("connection",(ws) => {
    ws.on("message", (msg) => {
        if(msg.type === "phonton"){
            const session = simulations.get(msg.session_id);

            session.phontons.push(...msg.data); //세션에 데이터 저장

            const target_socket = userSockets.get(msg.target);
            if(target_socket){
                target_socket.send(JSON.stringify({
                    type: "phonton",
                    session_id: msg.session_id,
                    data: msg.data
                }));
            }

        }else if(msg.type === "register"){ //유저 등록
            ws.user_id = msg.user_id;
            userSockets.set(msg.user_id,ws);
        }
    });

    ws.on("close",()=>{
        if(ws.user_id){
            userSockets.delete(ws.user_id);
        }
    })
});

app.get("/",(req,res)=>{
    res.render("index");
});

app.post("/simulation/start",(req,res)=>{ //연결 세션 만들기
    const {sender, target, phonton_count } = req.body;

    if(!sender || !target || !phonton_count) return res.status(400).json({ok: false});

    const sessionID = crypto.randomUUID;

    simulations.set(sessionID,{
        sender,
        target,
        phonton_count,
        phontons: [],
        measure: [],
        timeStamp: Date.now()
    });

    res.json({ok: true, session_id: sessionID});
});

server.listen(PORT,()=>{
    console.log(`[http://localhost:${PORT}]${PORT}번 포트에서 실행 중`)
});