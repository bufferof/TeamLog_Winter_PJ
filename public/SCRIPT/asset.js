const defines = {
  quantum: {
    bit: null,
    basis: null,
    polarization: null,
  },

  basis: ['+', 'x'],

  polarizationMap: {
    '+': ['↑', '→'],
    'x': ['↗', '↖']
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
        byte.toString(2).padStart(8, '0').split('').map(Number)
      );
  },

  encode_message: (bits, key) => {
    return bits.map((bit, i) => bit ^ key[i % key.length]);
  },

  decode_message: (bits, key) => {
    return bits.map((bit, i) => bit ^ key[i % key.length]);
  },

  bitsToString: (bits) => {
    let result = '';
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8).join('');
      result += String.fromCharCode(parseInt(byte, 2));
    }
    return result;
  }
};

export { defines, functions };


