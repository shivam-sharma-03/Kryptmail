export function encryptRailFence(text, rails) {
    const numRails = parseInt(rails);
    if (isNaN(numRails) || numRails < 2) {
      throw new Error("Rail Fence encryption requires at least 2 rails.");
    }
  
    const fence = Array.from({ length: numRails }, () => []);
    let rail = 0;
    let direction = 1;
  
    for (const char of text) {
      fence[rail].push(char);
      rail += direction;
  
      if (rail === 0 || rail === numRails - 1) {
        direction *= -1;
      }
    }
  
    return fence.flat().join('');
  }
  
  export function decryptRailFence(cipher, rails) {
    const numRails = parseInt(rails);
    if (isNaN(numRails) || numRails < 2) {
      throw new Error("Rail Fence decryption requires at least 2 rails.");
    }
  
    const length = cipher.length;
    const pattern = Array(length).fill(null);
  
    // Determine the rail for each character
    let rail = 0;
    let direction = 1;
    for (let i = 0; i < length; i++) {
      pattern[i] = rail;
      rail += direction;
  
      if (rail === 0 || rail === numRails - 1) {
        direction *= -1;
      }
    }
  
    // Count characters per rail
    const railCounts = Array(numRails).fill(0);
    pattern.forEach(r => railCounts[r]++);
  
    // Extract characters for each rail
    const railsArray = [];
    let pointer = 0;
    for (let r = 0; r < numRails; r++) {
      railsArray[r] = cipher.slice(pointer, pointer + railCounts[r]).split('');
      pointer += railCounts[r];
    }
  
    // Reconstruct the original text
    return pattern.map(r => railsArray[r].shift()).join('');
  }
  