// document.getElementById("encrypt").addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//         chrome.scripting.executeScript({
//             target: { tabId: tabs[0].id },
//             function: injectCipherAndEncrypt
//         });
//     });
// });

// document.getElementById("decrypt").addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//         chrome.scripting.executeScript({
//             target: { tabId: tabs[0].id },
//             function: injectCipherAndDecrypt
//         });
//     });
// });

// function injectCipherAndEncrypt() {
//     if (typeof window.caesarCipher === "undefined") {
//         window.caesarCipher = function (str, shift) {
//             return str.replace(/[a-zA-Z]/g, (char) => {
//                 const start = char <= "Z" ? 65 : 97;
//                 return String.fromCharCode(((char.charCodeAt(0) - start + shift + 26) % 26) + start);
//             });
//         };
//     }

//     // Target compose mode
//     let emailBody = document.querySelector('[role="textbox"], .Am.Al.editable, div[contenteditable="true"]');

//     if (emailBody) {
//         emailBody.innerText = window.caesarCipher(emailBody.innerText, 3);
//     }
// }

// function injectCipherAndDecrypt() {
//     if (typeof window.caesarCipher === "undefined") {
//         window.caesarCipher = function (str, shift) {
//             return str.replace(/[a-zA-Z]/g, (char) => {
//                 const start = char <= "Z" ? 65 : 97;
//                 return String.fromCharCode(((char.charCodeAt(0) - start + shift + 26) % 26) + start);
//             });
//         };
//     }

//     // Check both compose mode and received email body
//     let emailBody = document.querySelector('[role="textbox"], .Am.Al.editable, div[contenteditable="true"]');

//     // If no editable text area is found, check received email
//     if (!emailBody) {
//         emailBody = document.querySelector('div.a3s.aiL div[dir="ltr"]');
//     }

//     if (emailBody) {
//         emailBody.innerText = window.caesarCipher(emailBody.innerText, -3);
//     }
// }

let currentAction = ""; // 'encrypt' or 'decrypt'
let selectedTechnique = "";

// Elements
const mainScreen = document.getElementById("main-screen");
const techniqueScreen = document.getElementById("technique-screen");
const keyScreen = document.getElementById("key-screen");

const encryptBtn = document.getElementById("encrypt");
const decryptBtn = document.getElementById("decrypt");

const techniqueButtons = document.querySelectorAll(".technique");
const backToMainBtn = document.getElementById("back-to-main");

const doneBtn = document.getElementById("done");
const cancelKeyBtn = document.getElementById("cancel-key");

// Step 1: Encrypt or Decrypt button clicked
encryptBtn.addEventListener("click", () => {
  currentAction = "encrypt";
  showTechniqueScreen();
});

decryptBtn.addEventListener("click", () => {
  currentAction = "decrypt";
  showTechniqueScreen();
});

// Step 2: User selects a technique
techniqueButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedTechnique = button.dataset.technique;
    showKeyScreen();
  });
});

// Step 3: User enters key and clicks done
doneBtn.addEventListener("click", () => {
  const key = document.getElementById("key-input").value.trim();
  if (!key || isNaN(key)) {
    alert("Please enter a valid numeric key!");
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: performAction,
      args: [currentAction, selectedTechnique, key],
    });
  });

  resetScreens();
});

// Cancel buttons
backToMainBtn.addEventListener("click", resetScreens);
cancelKeyBtn.addEventListener("click", showTechniqueScreen);

// Screen switchers
function showTechniqueScreen() {
  mainScreen.style.display = "none";
  techniqueScreen.style.display = "block";
  keyScreen.style.display = "none";
}

function showKeyScreen() {
  mainScreen.style.display = "none";
  techniqueScreen.style.display = "none";
  keyScreen.style.display = "block";
}

function resetScreens() {
  mainScreen.style.display = "block";
  techniqueScreen.style.display = "none";
  keyScreen.style.display = "none";
}

// Injected function to perform encryption/decryption on page
function performAction(action, technique, key) {
  function caesarCipher(str, shift) {
    shift = parseInt(shift);
    return str.replace(/[a-zA-Z]/g, (char) => {
      const start = char <= "Z" ? 65 : 97;
      return String.fromCharCode(
        ((char.charCodeAt(0) - start + shift + 26) % 26) + start
      );
    });
  }

  function railFenceEncrypt(text, rails) {
    rails = parseInt(rails);
    if (rails <= 1) return text;

    const fence = Array.from({ length: rails }, () => []);
    let rail = 0;
    let direction = 1; // 1 = down, -1 = up

    for (let char of text) {
      fence[rail].push(char);
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction *= -1;
      }
    }

    return fence.flat().join("");
  }

  function railFenceDecrypt(cipherText, rails) {
    rails = parseInt(rails);
    if (rails <= 1) return cipherText;

    const length = cipherText.length;
    const fence = Array.from({ length: rails }, () => Array(length).fill(null));

    let rail = 0;
    let direction = 1;
    for (let i = 0; i < length; i++) {
      fence[rail][i] = "*"; // Placeholder
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction *= -1;
      }
    }

    // Fill the placeholders with the cipher text characters
    let index = 0;
    for (let r = 0; r < rails; r++) {
      for (let c = 0; c < length; c++) {
        if (fence[r][c] === "*" && index < cipherText.length) {
          fence[r][c] = cipherText[index++];
        }
      }
    }

    // Read the fence zigzag
    let result = "";
    rail = 0;
    direction = 1;
    for (let i = 0; i < length; i++) {
      result += fence[rail][i];
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction *= -1;
      }
    }

    return result;
  }

  function transpositionEncrypt(text, key) {
    key = parseInt(key);
    let numCols = key;
    let numRows = Math.ceil(text.length / numCols);
    let grid = Array.from({ length: numRows }, () => Array(numCols).fill(""));
    let index = 0;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (index < text.length) {
          grid[row][col] = text[index++];
        }
      }
    }

    let encryptedText = "";
    for (let col = 0; col < numCols; col++) {
      for (let row = 0; row < numRows; row++) {
        encryptedText += grid[row][col];
      }
    }
    return encryptedText;
  }

  function transpositionDecrypt(cipherText, key) {
    key = parseInt(key);
    let numCols = key;
    let numRows = Math.ceil(cipherText.length / numCols);
    let grid = Array.from({ length: numRows }, () => Array(numCols).fill(""));
    let index = 0;

    for (let col = 0; col < numCols; col++) {
      for (let row = 0; row < numRows; row++) {
        if (index < cipherText.length) {
          grid[row][col] = cipherText[index++];
        }
      }
    }

    let decryptedText = "";
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        decryptedText += grid[row][col];
      }
    }
    return decryptedText;
  }

  // Grab email body
  let emailBody = document.querySelector(
    '[role="textbox"], .Am.Al.editable, div[contenteditable="true"]'
  );

  if (!emailBody) {
    emailBody = document.querySelector('div.a3s.aiL div[dir="ltr"]');
  }

  if (!emailBody) {
    emailBody = document.querySelector("div.gs div.gE.iv.gt");
  }

  if (!emailBody) {
    alert("No email body found!");
    return;
  }

  let text = emailBody.innerText;
  let result = text;

  if (technique === "caesar") {
    const shift = action === "encrypt" ? parseInt(key) : -parseInt(key);
    result = caesarCipher(text, shift);
  } else if (technique === "rail-fence") {
    if (action === "encrypt") {
      result = railFenceEncrypt(text, key);
    } else {
      result = railFenceDecrypt(text, key);
    }
  } else if (technique === "transposition") {
    if (action === "encrypt") {
      result = transpositionEncrypt(text, key);
    } else {
      result = transpositionDecrypt(text, key);
    }
  }

  emailBody.innerText = result;
}
