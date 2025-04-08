import { encryptCaesar } from './cipher/caesar.js';
import { encryptRailFence } from './cipher/railfence.js';
import { encryptVigenere } from './cipher/vigenere.js';

// Get selected text or email body
function getSelectedTextOrEmailBody() {
  const selection = window.getSelection().toString().trim();
  if (selection) return selection;

  const contentEditable = document.querySelector('[contenteditable="true"]');
  return contentEditable ? contentEditable.innerText : '';
}

// Replace selection or entire editable area with encrypted text
function replaceWithEncryptedText(encryptedText) {
  const selection = window.getSelection();
  if (selection.toString().trim()) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(encryptedText));
  } else {
    const editable = document.querySelector('[contenteditable="true"]');
    if (editable) editable.innerText = encryptedText;
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
    default:
      return false;
  }
}

// Main
(async function () {
  const technique = localStorage.getItem('symmetricTechnique');
  const key = localStorage.getItem('symmetricKey');

  if (!technique || !key) {
    alert("❌ Missing encryption technique or key.");
    return;
  }

  if (!isValidKey(technique, key)) {
    alert(`❌ Invalid key format for ${technique} cipher.`);
    return;
  }

  const text = getSelectedTextOrEmailBody();
  if (!text) {
    alert("❌ No text selected or editable body found.");
    return;
  }

  let encrypted = "";

  try {
    switch (technique.toLowerCase()) {
      case 'caesar':
        encrypted = encryptCaesar(text, parseInt(key));
        break;
      case 'railfence':
        encrypted = encryptRailFence(text, parseInt(key));
        break;
      case 'vigenere':
        encrypted = encryptVigenere(text, key);
        break;
      default:
        throw new Error("Unsupported encryption technique.");
    }

    replaceWithEncryptedText(encrypted);
    alert("✅ Encryption complete!");
  } catch (err) {
    console.error("Encryption error:", err);
    alert("⚠️ Encryption failed.");
  }
})();
