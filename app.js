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

app.post("/send",(req,res)=>{
    res.json({ ok: true});
});

app.listen(PORT,()=>{
    console.log(`[http://localhost:${PORT}]${PORT}번 포트에서 실행 중`)
});