import {defines,functions} from './asset'

document.addEventListener('DOMContentLoaded',()=>{
    const start_btn = document.getElementById('start_btn');

    start_btn.addEventListener('click',()=>{
        start_btn.disable = true //중복 클릭 방지

        //데이터 가져오기
        const send_text = document.getElementById('text_send').value;
        const target_id = document.getElementById('target').value;       

        
    });
});