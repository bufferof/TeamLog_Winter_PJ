const defines = {
    quantum :{
        bit:null,
        basis:null,
        polarization:null,
    }, //양자 형태(객체)
    // const new_quantum = structuredClone(quantum); 로 복사

    polar_set :['↑', '→', '↗', '↖'], // 편광 상태는 인덱스로 관리
}

const functions = {
    // 함수들
    measure :(phonton,measuring_basis)=>{ //광자(객체), 현재 측정 중인 사람의 기저
        if(phonton.basis == measuring_basis){ //기저가 같으면 같은 비트 리턴
            return phonton.bit;
        }

        return Math.random()<0.5?1:0; //기저가 다르면 랜덤한 비트 리턴
    },

    make_phonton :(bit,basis)=>{ //(비트, 기저) 광자 생성
        const new_phonton = structuredClone(defines.quantum);
        new_phonton.bit = bit;
        new_phonton.basis = basis;

        if(basis === '+'){ //수평 및 수직 기저
            new_phonton.polarization = bit === 0?0:1; //인덱스로 관리
        }else if(basis === 'x'){ //대각선 기저
            new_phonton.polarization = bit === 0?2:3; 
        }

        return new_phonton;
    }
}

//아마 광자는 객체로 관리되고, 광자들은 배열로 관리될 듯

export {defines,functions}