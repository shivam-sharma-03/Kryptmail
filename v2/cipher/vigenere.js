function getShift(char) {
  return char.charCodeAt(0) - 97;
}

function isLetter(char) {
  return /^[a-zA-Z]$/.test(char);
}

function validateVigenereKey(key) {
  if (!key || !/^[a-zA-Z]+$/.test(key)) {
    throw new Error("❌ Invalid key. Vigenère key must be a non-empty alphabetic string (A–Z only).");
  }
}

export function encryptVigenere(plain, key) {
  validateVigenereKey(key);

  key = key.toLowerCase();
  let result = '';
  let j = 0;

  for (const char of plain) {
    const shift = getShift(key[j % key.length]);

    if (/[a-z]/.test(char)) {
      result += String.fromCharCode((char.charCodeAt(0) - 97 + shift) % 26 + 97);
      j++;
    } else if (/[A-Z]/.test(char)) {
      result += String.fromCharCode((char.charCodeAt(0) - 65 + shift) % 26 + 65);
      j++;
    } else {
      result += char;
    }
  }

  return result;
}

export function decryptVigenere(cipher, key) {
  validateVigenereKey(key);

  key = key.toLowerCase();
  let result = '';
  let j = 0;

  for (const char of cipher) {
    const shift = getShift(key[j % key.length]);

    if (/[a-z]/.test(char)) {
      result += String.fromCharCode((char.charCodeAt(0) - 97 - shift + 26) % 26 + 97);
      j++;
    } else if (/[A-Z]/.test(char)) {
      result += String.fromCharCode((char.charCodeAt(0) - 65 - shift + 26) % 26 + 65);
      j++;
    } else {
      result += char;
    }
  }

  return result;
}
