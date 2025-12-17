import { defines, functions } from './asset.js'


document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket("ws://localhost:3000"); //포트는 아마 dotenv로 해야할 것 같은데 아직 안넣음

    const simulation_form = document.getElementById("simulation");
    const user_id = document.getElementById('user_id');
    const target = document.getElementById('target');
    const text_send_content = document.getElementById('text_send');
    const output_window = document.getElementById('output_window');
    const user_basis = document.getElementById('select_phonton');

    let sender_basis = [];
    let message_facilitated = [];
    const final_bits = []; //키임
    const measure_bits = [];

    user_id.textContent = crypto.randomUUID();

    output_window.textContent = "유저 등록중...";
    ws.onopen = () => {
        ws.send(JSON.stringify({ // WS에 유저 등록
            type: "register",
            user_id: user_id.textContent
        }));
    }
    output_window.textContent = "[!] 등록 성공!\n";

    ws.onmessage = (msg) => {
        const msg_data = JSON.parse(msg.data);


        if (msg_data.type === "phonton") {
            output_window.textContent += "[+] 광자 수신 완료\n";
            msg_data.data.forEach(phonton => {
                const bit = functions.measure(phonton, user_basis.options[user_basis.selectedIndex].value);
                measure_bits.push(bit);
            });

            output_window.textContent += "[+] 비트 수신 완료\n"
            output_window.textContent += measure_bits.join('');
            output_window.textContent += "\n";

            ws.send(JSON.stringify({
                type: "basis",
                session_id: msg_data.session_id,
                data: measure_bits,
                basis: user_basis.options[user_basis.selectedIndex].value,
                target: 'sender'
            }));

        } else if (msg_data.type === "basis_sender") {
            for (let i = 0; i < sender_basis.length; i++) {
                if (sender_basis[i] === msg_data.data) {
                    final_bits.push(message_facilitated[i].bit);
                }
            }

            output_window.textContent += `[!] 키 : ${final_bits.join('')}\n`;

            ws.send(JSON.stringify({
                type: "basis",
                session_id: msg_data.session_id,
                basis: sender_basis,
                target: 'target',
            }));
        } else if (msg_data.type === "basis_target") {
            for (let i = 0; i < msg_data.data.length; i++) {
                if (msg_data.data[i] === user_basis.options[user_basis.selectedIndex].value) {
                    final_bits.push(measure_bits[i]);
                }
            }

            output_window.textContent += `[!] 키 : ${final_bits.join('')}\n`;
        }
    }


    simulation_form.addEventListener("submit", async (e) => {
        e.preventDefault(); //새로고침 막음

        //보내기 전 광자 만들기
        const message = text_send_content.value;
        const message_bits = functions.string_to_bits(message);

        const temp_bits = [];
        for (let bit of message_bits) {
            const basis = Math.random() < 0.5 ? '+' : 'x'
            sender_basis.push(basis);

            let obj = functions.make_photon(bit, basis)
            message_facilitated.push(obj);
            temp_bits.push(obj.bit);
        }

        output_window.textContent += `[+] 데이터 인코딩 성공\n`;
        output_window.textContent += temp_bits.join('');
        output_window.textContent += "\n";

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

        if (!res.ok) {
            //뭔가 에러메시지 프엔에 출력하는 로직
            output_window.textContent = "[X] 전송 실패\n";
            return;
        }

        const { session_id } = await res.json();
        output_window.textContent += "[+] 현재 세션 아이디\n";
        output_window.textContent += session_id;
        output_window.textContent += "\n";

        ws.send(JSON.stringify({
            type: "phonton",
            session_id: session_id,
            data: message_facilitated
        }));


    });
});