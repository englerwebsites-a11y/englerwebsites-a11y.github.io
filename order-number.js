// Order numbers for order form submissions, shared by client-form.html and the portal pages.
// Each one is worked out from the submission's Firestore document ID, which is random,
// permanent and unique, so an order always keeps the same number and two orders don't share
// one. Nothing extra is stored. Format: ENG-XXXX-XXXX.
(function () {
  // Crockford base32: no I, L, O or U, so codes are easy to read out and type.
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  function orderNumber(id) {
    // 64-bit FNV-1a hash of the whole ID, so every character of it counts.
    let h = 0xcbf29ce484222325n;
    for (const ch of String(id)) {
      h ^= BigInt(ch.charCodeAt(0));
      h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
    }
    // Final mix (MurmurHash3 fmix64) so IDs that differ by one character get unrelated codes.
    const M = 0xffffffffffffffffn;
    h ^= h >> 33n; h = (h * 0xff51afd7ed558ccdn) & M;
    h ^= h >> 33n; h = (h * 0xc4ceb9fe1a85ec53n) & M;
    h ^= h >> 33n;
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += ALPHABET[Number(h & 31n)];
      h >>= 5n;
    }
    return `ENG-${code.slice(0, 4)}-${code.slice(4)}`;
  }

  window.OrderNumber = { orderNumber };
})();
