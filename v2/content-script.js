import { encryptCaesar, decryptCaesar } from './cipher/caesar.js';
import { encryptRailFence, decryptRailFence } from './cipher/railfence.js';
import { encryptVigenere, decryptVigenere } from './cipher/vigenere.js';
import { rsaEncrypt, rsaDecrypt, isValidPemKey } from './cipher/rsa.js';

// Get selected text or email body
function getSelectedTextOrEmailBody() {
  const selection = window.getSelection().toString().trim();
  if (selection) return selection;

  const contentEditable = document.querySelector('[contenteditable="true"]');
  return contentEditable ? contentEditable.innerText : '';
}

// Replace selection or entire editable area with processed text
function replaceWithProcessedText(processedText) {
  const selection = window.getSelection();
  if (selection.toString().trim()) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(processedText));
  } else {
    const editable = document.querySelector('[contenteditable="true"]');
    if (editable) editable.innerText = processedText;
  }
}

// Validate key based on technique
function isValidKey(technique, key) {
  switch (technique.toLowerCase()) {
    case 'caesar':
    case 'railfence':
      return !isNaN(parseInt(key)) && parseInt(key) > 0;
    case 'vigenere':
      return /^[a-zA-Z]+$/.test(key);
    case 'rsa':
      return isValidPemKey(key, 'PUBLIC') || isValidPemKey(key, 'PRIVATE');
    default:
      return false;
  }
}

// Main
(async function () {
  const technique = localStorage.getItem('symmetricTechnique');
  const key = localStorage.getItem('symmetricKey');
  const rsaPublicKey = localStorage.getItem('rsaPublicKey');
  const rsaPrivateKey = localStorage.getItem('rsaPrivateKey');
  const mode = localStorage.getItem('mode'); // "encrypt" or "decrypt"

  const text = getSelectedTextOrEmailBody();
  if (!technique || !text) {
    alert(`❌ Missing ${mode} technique or no text found.`);
    return;
  }

  let processedText = "";

  try {
    switch (technique.toLowerCase()) {
      case 'caesar':
        if (!isValidKey(technique, key)) throw new Error("Invalid Caesar key");
        processedText = mode === 'encrypt'
          ? encryptCaesar(text, parseInt(key))
          : decryptCaesar(text, parseInt(key));
        break;

      case 'railfence':
        if (!isValidKey(technique, key)) throw new Error("Invalid Rail Fence key");
        processedText = mode === 'encrypt'
          ? encryptRailFence(text, parseInt(key))
          : decryptRailFence(text, parseInt(key));
        break;

      case 'vigenere':
        if (!isValidKey(technique, key)) throw new Error("Invalid Vigenère key");
        processedText = mode === 'encrypt'
          ? encryptVigenere(text, key)
          : decryptVigenere(text, key);
        break;

      case 'rsa':
        if (mode === 'encrypt') {
          if (!rsaPublicKey || !isValidPemKey(rsaPublicKey, 'PUBLIC')) {
            throw new Error("Missing or invalid RSA public key.");
          }
          processedText = await rsaEncrypt(text, rsaPublicKey);
        } else if (mode === 'decrypt') {
          if (!rsaPrivateKey || !isValidPemKey(rsaPrivateKey, 'PRIVATE')) {
            throw new Error("Missing or invalid RSA private key.");
          }
          processedText = await rsaDecrypt(text, rsaPrivateKey);
        }
        break;

      default:
        throw new Error("Unsupported technique.");
    }

    replaceWithProcessedText(processedText);
    alert(`✅ ${mode === 'decrypt' ? 'Decryption' : 'Encryption'} complete!`);
  } catch (err) {
    console.error(`${mode === 'decrypt' ? 'Decryption' : 'Encryption'} error:`, err);
    alert(`⚠️ ${mode === 'decrypt' ? 'Decryption' : 'Encryption'} failed: ${err.message}`);
  }
})();