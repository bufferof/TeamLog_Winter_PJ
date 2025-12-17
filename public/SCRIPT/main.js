import {defines,functions} from './asset.js'

document.addEventListener('DOMContentLoaded',()=>{
    const simulation_form = document.getElementById("simulation");
    const user_id = document.getElementById('user_id');
    const target = document.getElementById('target');
    const text_send_content = document.getElementById('text_send');
    const output_window = document.getElementById('output_window');
    
    simulation_form.addEventListener("submit", async (e)=>{
        e.preventDefault(); //새로고침 막음

        //보내기 전 광자 만들기
        const message = text_send_content.value;
        

        const res = await fetch("/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sender: user_id.textContent, //보낸 이
                target: target.value, //받는 이
                message: text_send_content.value //보낼 메시지
            })
        });

        if(!res.ok){
            //뭔가 에러메시지 프엔에 출력하는 로직
            output_window.textContent = "전송 실패";
            return;
        }


    });
});