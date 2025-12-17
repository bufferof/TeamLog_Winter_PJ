import {defines,functions} from './asset.js'



document.addEventListener('DOMContentLoaded',()=>{
    const ws = new WebSocket("ws://localhost:3000"); //포트는 아마 dotenv로 해야할 것 같은데 아직 안넣음

    const simulation_form = document.getElementById("simulation");
    const user_id = document.getElementById('user_id');
    const target = document.getElementById('target');
    const text_send_content = document.getElementById('text_send');
    const output_window = document.getElementById('output_window');

    user_id.textContent = crypto.randomUUID();
    
    simulation_form.addEventListener("submit", async (e)=>{
        e.preventDefault(); //새로고침 막음

        //보내기 전 광자 만들기
        const message = text_send_content.value;
        const message_bits = functions.string_to_bits(message);

        let message_facilitated = [];
        for(let bit of message_bits){
            message_facilitated.push(functions.make_photon(bit,Math.random() < 0.5 ? '+' : 'x'));
        }

        console.log(message_facilitated);

        const res = await fetch("/simulation/start", { //시뮬 시작 POST
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sender: user_id.textContent, //보낸 이
                target: target.value, //받는 이
                phonton_count: message_facilitated.length
            })
        });

        if(!res.ok){
            //뭔가 에러메시지 프엔에 출력하는 로직
            output_window.textContent = "전송 실패";
            return;
        }

        const { session_id } = res.json;

        ws.send(JSON.stringify({
            type: "phonton",
            session_id: session_id,
            data: message_facilitated
        }));

        

    });
});