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
    }
}