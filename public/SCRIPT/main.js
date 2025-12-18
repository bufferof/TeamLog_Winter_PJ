import { defines, functions } from './asset.js'

document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket("ws://localhost:3000");
    const simulation_form = document.getElementById("simulation");
    const user_id = document.getElementById('user_id');
    const target = document.getElementById('target');
    const text_send_content = document.getElementById('text_send');
    const output_window = document.getElementById('output_window');
    const user_basis = document.getElementById('select_phonton');
    
    let sender_basis = [];
    let receiver_basis = []; 
    let message_facilitated = [];
    let final_bits = [];
    let measure_bits = [];
    let session_id;
    let current_message = null; 
    let is_sender = false; 
    
    
    const my_user_id = crypto.randomUUID();
    
    
    
    if (user_id) {
        user_id.textContent = my_user_id;
        
    } else {
        
    }
    
    output_window.textContent = "유저 등록중...\n";
    
    ws.onopen = () => {
        
        ws.send(JSON.stringify({
            type: "register",
            user_id: my_user_id
        }));
        output_window.textContent = "[!] 등록 성공!\n";
        
    }
    
    ws.onmessage = (msg) => {
        const msg_data = JSON.parse(msg.data);
        
        if (msg_data.type === "phonton") {
            
            is_sender = false;
            output_window.textContent += "[+] 광자 수신 완료\n";
            
            measure_bits = [];
            receiver_basis = []; 
            
            msg_data.data.forEach(phonton => {
                
                const random_basis = Math.random() < 0.5 ? '+' : 'x';
                receiver_basis.push(random_basis);
                
                const bit = functions.measure(phonton, random_basis);
                measure_bits.push(bit);
            });
            
            output_window.textContent += "[+] 비트 측정 완료\n";
            output_window.textContent += `측정값: ${measure_bits.join('')}\n`;
            output_window.textContent += `측정 기저: ${receiver_basis.join('')}\n`;
            
            
            ws.send(JSON.stringify({
                type: "basis",
                session_id: msg_data.session_id,
                data: measure_bits,
                basis: receiver_basis, 
                target: 'sender'
            }));
            
        } else if (msg_data.type === "basis_sender") {
            
            output_window.textContent += "[+] 수신자의 측정 기저 수신\n";
            
            const receiver_basis_array = msg_data.basis; 
            const matching_indices = [];
            final_bits = [];
            
            
            for (let i = 0; i < sender_basis.length; i++) {
                if (sender_basis[i] === receiver_basis_array[i]) {
                    final_bits.push(message_facilitated[i].bit);
                    matching_indices.push(i);
                }
            }
            
            output_window.textContent += `[+] 송신 기저: ${sender_basis.join('')}\n`;
            output_window.textContent += `[+] 수신 기저: ${receiver_basis_array.join('')}\n`;
            output_window.textContent += `[+] 일치하는 기저 개수: ${final_bits.length}/${sender_basis.length}\n`;
            
            if (final_bits.length === 0) {
                output_window.textContent += "[X] 일치하는 기저가 없습니다. 재전송 필요\n";
                restartQuantumTransmission();
                return;
            }
            
            
            const sample_size = Math.max(1, Math.floor(final_bits.length * 0.2));
            const sample_indices = [];
            const available_indices = [...Array(final_bits.length).keys()];
            
            for (let i = 0; i < sample_size; i++) {
                const random_idx = Math.floor(Math.random() * available_indices.length);
                sample_indices.push(available_indices[random_idx]);
                available_indices.splice(random_idx, 1);
            }
            
            sample_indices.sort((a, b) => a - b);
            
            const sample_bits = sample_indices.map(idx => final_bits[idx]);
            
            output_window.textContent += `[+] 샘플 크기: ${sample_size} (20%)\n`;
            output_window.textContent += `[+] 샘플 인덱스: ${sample_indices.join(', ')}\n`;
            
            
            ws.send(JSON.stringify({
                type: "verify_sample",
                session_id: msg_data.session_id,
                sample_indices: sample_indices,
                sample_bits: sample_bits,
                matching_indices: matching_indices
            }));
            
        } else if (msg_data.type === "verify_sample") {
            
            output_window.textContent += "[+] 도청 검증 시작\n";
            
            const receiver_matching_bits = [];
            
            
            for (let i = 0; i < msg_data.matching_indices.length; i++) {
                const original_idx = msg_data.matching_indices[i];
                receiver_matching_bits.push(measure_bits[original_idx]);
            }
            
            output_window.textContent += `[+] 일치하는 비트 수: ${receiver_matching_bits.length}\n`;
            
            
            let error_count = 0;
            for (let i = 0; i < msg_data.sample_indices.length; i++) {
                const sample_idx = msg_data.sample_indices[i];
                const sender_bit = msg_data.sample_bits[i];
                const receiver_bit = receiver_matching_bits[sample_idx];
                
                if (sender_bit !== receiver_bit) {
                    error_count++;
                    output_window.textContent += `[!] 오류 발견 - 인덱스 ${sample_idx}: 송신=${sender_bit}, 수신=${receiver_bit}\n`;
                }
            }
            
            const error_rate = error_count / msg_data.sample_bits.length;
            output_window.textContent += `[+] 오류율: ${(error_rate * 100).toFixed(2)}%\n`;
            
            if (error_count > 0) {
                output_window.textContent += "[X] 도청 감지! 세션 종료 및 재전송\n";
                
                ws.send(JSON.stringify({
                    type: "verify_result",
                    session_id: msg_data.session_id,
                    success: false,
                    error_rate: error_rate
                }));
                
                
                setTimeout(() => {
                    output_window.textContent += "[+] 재전송 준비 중...\n";
                }, 1000);
                
            } else {
                output_window.textContent += "[!] 도청 없음 확인\n";
                
                
                final_bits = receiver_matching_bits.filter((bit, idx) => 
                    !msg_data.sample_indices.includes(idx)
                );
                
                output_window.textContent += `[!] 최종 키 (${final_bits.length}비트): ${final_bits.join('')}\n`;
                output_window.textContent += "[+] 일반 통신으로 전환됨\n";
                
                ws.send(JSON.stringify({
                    type: "verify_result",
                    session_id: msg_data.session_id,
                    success: true,
                    error_rate: 0,
                    final_key_length: final_bits.length
                }));
            }
            
        } else if (msg_data.type === "verify_result") {
            
            if (msg_data.success) {
                output_window.textContent += "[!] 수신자 검증 성공\n";
                
                
                const sample_indices = msg_data.sample_indices || [];
                final_bits = final_bits.filter((bit, idx) => 
                    !sample_indices.includes(idx)
                );
                
                output_window.textContent += `[!] 최종 키 (${final_bits.length}비트): ${final_bits.join('')}\n`;
                output_window.textContent += "[+] 일반 통신으로 전환됨\n";
                
                
                if (current_message) {
                    const message_bits = functions.string_to_bits(current_message);
                    
                    output_window.textContent += "[+] 메시지 암호화 및 전송 중...\n";
                    output_window.textContent += `[+] 메시지: ${message_bits.length}비트, 키: ${final_bits.length}비트 (반복 사용)\n`;
                    
                    const encoded = functions.encode_message(message_bits, final_bits);
                    
                    ws.send(JSON.stringify({
                        type: "general",
                        session_id: session_id,
                        data: encoded,
                        message_length: message_bits.length
                    }));
                    
                    output_window.textContent += `[+] 암호화 완료 (${message_bits.length}비트 메시지 전송)\n`;
                    current_message = null;
                }
                
            } else {
                output_window.textContent += "[X] 수신자 검증 실패 (도청 감지)\n";
                output_window.textContent += `[X] 오류율: ${(msg_data.error_rate * 100).toFixed(2)}%\n`;
                output_window.textContent += "[+] 재전송 시작...\n";
                
                
                setTimeout(() => {
                    restartQuantumTransmission();
                }, 1000);
            }
            
        } else if (msg_data.type === "general") {
            
            const message_length = msg_data.message_length || msg_data.data.length;
            const decoded_bits = functions.decode_message(msg_data.data, final_bits).slice(0, message_length);
            
            
            const bytes = [];
            for (let i = 0; i < decoded_bits.length; i += 8) {
                const byte = decoded_bits.slice(i, i + 8).join('');
                bytes.push(parseInt(byte, 2));
            }
            const decoded_message = new TextDecoder().decode(new Uint8Array(bytes));
            
            output_window.textContent += "[+] 메시지 도착\n";
            output_window.textContent += `[+] 복호화 (${message_length}비트)\n`;
            output_window.textContent += "[+] 메시지: " + decoded_message + "\n";
        }
    }
    
    
    async function restartQuantumTransmission() {
        if (!current_message || !is_sender) {
            return;
        }
        
        output_window.textContent += "\n=== 양자 키 분배 재시작 ===\n";
        
        
        sender_basis = [];
        receiver_basis = [];
        message_facilitated = [];
        final_bits = [];
        measure_bits = [];
        
        const message_bits = functions.string_to_bits(current_message);
        const temp_bits = [];
        
        for (let bit of message_bits) {
            const basis = Math.random() < 0.5 ? '+' : 'x';
            sender_basis.push(basis);
            let obj = functions.make_photon(bit, basis);
            message_facilitated.push(obj);
            temp_bits.push(obj.bit);
        }
        
        output_window.textContent += `[+] 데이터 재인코딩 완료\n`;
        output_window.textContent += `광자 비트: ${temp_bits.join('')}\n`;
        
        const res = await fetch("/simulation/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sender: my_user_id,
                target: target.value,
                phonton_count: message_facilitated.length
            })
        });
        
        if (!res.ok) {
            output_window.textContent += "[X] 재전송 실패\n";
            return;
        }
        
        const { session_id: sid } = await res.json();
        session_id = sid;
        
        output_window.textContent += `[+] 새 세션 ID: ${session_id}\n`;
        
        ws.send(JSON.stringify({
            type: "phonton",
            session_id: session_id,
            data: message_facilitated
        }));
    }
    
    simulation_form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const message = text_send_content.value;
        
        if (!message) {
            output_window.textContent += "[X] 메시지를 입력하세요\n";
            return;
        }
        
        
        if (final_bits.length > 0) {
            const message_bits = functions.string_to_bits(message);
            const encoded = functions.encode_message(message_bits, final_bits);
            
            ws.send(JSON.stringify({
                type: "general",
                session_id: session_id,
                data: encoded,
                message_length: message_bits.length
            }));
            
            output_window.textContent += `[+] 암호화된 메시지 전송 완료\n`;
            output_window.textContent += `[+] 메시지: ${message_bits.length}비트, 키: ${final_bits.length}비트 (반복 사용)\n`;
            return;
        }
        
        
        is_sender = true;
        current_message = message; 
        
        const message_bits = functions.string_to_bits(message);
        const temp_bits = [];
        
        sender_basis = [];
        message_facilitated = [];
        
        for (let bit of message_bits) {
            const basis = Math.random() < 0.5 ? '+' : 'x';
            sender_basis.push(basis);
            let obj = functions.make_photon(bit, basis);
            message_facilitated.push(obj);
            temp_bits.push(obj.bit);
        }
        
        output_window.textContent += `[+] 데이터 인코딩 성공\n`;
        output_window.textContent += `광자 비트: ${temp_bits.join('')}\n`;
        
        
        
        const res = await fetch("/simulation/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sender: my_user_id,
                target: target.value,
                phonton_count: message_facilitated.length
            })
        });
        
        
        
        if (!res.ok) {
            output_window.textContent += "[X] 전송 실패\n";
            
            return;
        }
        
        const { session_id: sid } = await res.json();
        session_id = sid;
        
        
        
        output_window.textContent += `[+] 현재 세션 ID: ${session_id}\n`;
        
        
        
        ws.send(JSON.stringify({
            type: "phonton",
            session_id: session_id,
            data: message_facilitated
        }));
    });
});