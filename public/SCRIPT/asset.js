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
  }
};

export { defines, functions };


