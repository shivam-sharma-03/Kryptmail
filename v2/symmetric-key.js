const technique = localStorage.getItem('symmetricTechnique') || '';
const mode = localStorage.getItem('mode') || ''; // "encrypt" or "decrypt"

if (!technique || !mode) {
  alert("Missing encryption technique or mode. Please go back and select again.");
  window.location.href = "symmetric-techniques.html";
}

const techLabel = technique.charAt(0).toUpperCase() + technique.slice(1);
document.getElementById('tech-name').innerText = `${techLabel} ${mode === 'decrypt' ? 'Decryption' : 'Encryption'}`;

document.getElementById("done-btn").addEventListener("click", () => {
  let key = document.getElementById("sym-key").value.trim();
  if (!key) {
    alert("Please enter the key.");
    return;
  }

  const lowerTechnique = technique.toLowerCase();

  if (['caesar', 'railfence'].includes(lowerTechnique)) {
    const parsedKey = parseInt(key);
    if (isNaN(parsedKey)) {
      alert("Key must be a number for this technique.");
      return;
    }

    key = (lowerTechnique === 'caesar' && mode === 'decrypt') ? -parsedKey : parsedKey;

  } else if (lowerTechnique === 'vigenere') {
    if (!/^[a-zA-Z]+$/.test(key)) {
      alert("Key must only contain alphabetic characters (A–Z) for Vigenère cipher.");
      return;
    }
  }

  localStorage.setItem('symmetricKey', key);

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectEncryptAndRun,
      args: [technique, key, mode],
    });
  });
});

document.getElementById("back-btn").addEventListener("click", () => {
  window.history.back();
});

function injectEncryptAndRun(technique, key, mode) {
  function encryptCaesar(text, shift) {
    shift = parseInt(shift) % 26;
    return text.replace(/[a-z]/gi, (char) => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + shift + 26) % 26) + base);
    });
  }

  function encryptRailFence(text, numRails) {
    numRails = parseInt(numRails);
    const fence = Array.from({ length: numRails }, () => []);
    let rail = 0;
    let direction = 1;

    for (const char of text) {
      fence[rail].push(char);
      rail += direction;
      if (rail === 0 || rail === numRails - 1) direction *= -1;
    }

    return fence.flat().join('');
  }

  function decryptRailFence(cipher, numRails) {
    numRails = parseInt(numRails);
    const length = cipher.length;
    const pattern = Array(length).fill(null);
    let rail = 0, direction = 1;

    for (let i = 0; i < length; i++) {
      pattern[i] = rail;
      rail += direction;
      if (rail === 0 || rail === numRails - 1) direction *= -1;
    }

    const railCounts = Array(numRails).fill(0);
    pattern.forEach(r => railCounts[r]++);

    const railsArray = [];
    let pointer = 0;
    for (let r = 0; r < numRails; r++) {
      railsArray[r] = cipher.slice(pointer, pointer + railCounts[r]).split('');
      pointer += railCounts[r];
    }

    return pattern.map(r => railsArray[r].shift()).join('');
  }

  function encryptVigenere(plain, key) {
    key = key.toLowerCase();
    let result = '', j = 0;

    for (const char of plain) {
      const shift = key.charCodeAt(j % key.length) - 97;

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

  function decryptVigenere(cipher, key) {
    key = key.toLowerCase();
    let result = '', j = 0;

    for (const char of cipher) {
      const shift = key.charCodeAt(j % key.length) - 97;

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

  const editable = mode === 'decrypt'
    ? document.querySelector('div.elementToProof') || // Outlook-specific div for composing
      document.querySelector('[contenteditable="true"]') || // Gmail-specific div for composing
      document.querySelector('div[tabindex="0"][role="textbox"][aria-label*="Message body"]') || // Fallback for Gmail composing
      document.querySelector('div.a3s.aiL') || // Gmail-specific div for reading
      document.querySelector('div.XbIp4.jmmB7.GNqVo.allowTextSelection.OuGoX') // Outlook-specific div for reading
    : document.querySelector('div.elementToProof') || // Outlook-specific div for composing
      document.querySelector('[contenteditable="true"]') || // Gmail-specific div for composing
      document.querySelector('div[tabindex="0"][role="textbox"][aria-label*="Message body"]'); // Fallback for Gmail composing

  if (!editable) {
    alert("❌ No editable content found.");
    return;
  }

  const text = editable.innerText.trim();
  if (!text) {
    alert("❌ No email body content found.");
    return;
  }

  let output = '';
  try {
    switch (technique.toLowerCase()) {
      case 'caesar':
        output = encryptCaesar(text, key);
        break;
      case 'railfence':
        output = (mode === 'decrypt') ? decryptRailFence(text, key) : encryptRailFence(text, key);
        break;
      case 'vigenere':
        output = (mode === 'decrypt') ? decryptVigenere(text, key) : encryptVigenere(text, key);
        break;
      default:
        alert("Unsupported encryption technique.");
        return;
    }

    editable.innerText = output;
    alert(`✅ ${mode === 'decrypt' ? 'Decryption' : 'Encryption'} using ${technique} complete.`);
  } catch (err) {
    console.error("Encryption error:", err);
    alert("❌ Operation failed.");
  }
}