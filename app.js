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

const users = new Map();

wss.on("connection",(ws) => {
    ws.on("message", (msg) => {
        
    });
});

app.get("/",(req,res)=>{
    res.render("index");
});

app.post("/simulation/start",(req,res)=>{ //연결 세션 만들기
    const {sender, target, phonton_count } = req.body;

    if(!sender || !target || !phonton_count) return res.status(400).json({ok: false});

    const sessionID = crypto.randomUUID;

    users.set(sessionID,{
        sender,
        target,
        phonton_count,
        phontons: [],
        measure: [],
        timeStamp: Date.now()
    });

    res.json({ok: true, session_id: sessionID});
});

app.listen(PORT,()=>{
    console.log(`[http://localhost:${PORT}]${PORT}번 포트에서 실행 중`)
});