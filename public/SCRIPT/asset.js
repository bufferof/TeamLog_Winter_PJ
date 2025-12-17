const defines = {
  quantum: {
    bit: null,
    basis: null,
    polarization: null,
  },

  basis: ['+', 'x'],

  polarizationMap: {
    '+': ['↑', '→'], // 0,1
    'x': ['↗', '↖']  // 0,1
  }
};


const functions = {
  measure: (photon, measuring_basis) => {
    if (photon.basis === measuring_basis) {
      return photon.bit;
    }
    return Math.random() < 0.5 ? 1 : 0;
  },

  make_photon: (bit, basis) => {
    const photon = structuredClone(defines.quantum);
    photon.bit = bit;
    photon.basis = basis;
    photon.polarization = defines.polarizationMap[basis][bit];
    return photon;
  },

  string_to_bits: (string) => {
    const encoder = new TextEncoder();
    return [...encoder.encode(string)]
    .flatMap(byte => 
        byte.toString(2).padStart(8,'0').split('').map(Number)
    );
  }
};

export { defines, functions };


