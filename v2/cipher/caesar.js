export function encryptCaesar(text, shift) {
    const parsedShift = parseInt(shift);
    if (isNaN(parsedShift)) {
      throw new Error("Invalid Caesar shift: must be a number");
    }
  
    const normalizedShift = ((parsedShift % 26) + 26) % 26; // handles negatives too
  
    return text.split('').map(char => {
      if (/[a-z]/.test(char)) {
        return String.fromCharCode((char.charCodeAt(0) - 97 + normalizedShift) % 26 + 97);
      } else if (/[A-Z]/.test(char)) {
        return String.fromCharCode((char.charCodeAt(0) - 65 + normalizedShift) % 26 + 65);
      } else {
        return char;
      }
    }).join('');
  }
  
  export function decryptCaesar(text, shift) {
    const parsedShift = parseInt(shift);
    if (isNaN(parsedShift)) {
      throw new Error("Invalid Caesar shift: must be a number");
    }
  
    const normalizedShift = ((26 - (parsedShift % 26)) + 26) % 26;
    return encryptCaesar(text, normalizedShift);
  }
  