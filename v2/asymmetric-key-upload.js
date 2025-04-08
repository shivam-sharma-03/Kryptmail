let privateKeyText = '';

function detectPlatform() {
  if (location.host.includes("mail.google.com")) return "gmail";
  if (location.host.includes("outlook.live.com") || location.host.includes("outlook.office.com")) return "outlook";
  return "unknown";
}

function getEmailBodyText() {
  try {
    const editable = document.querySelector('[contenteditable="true"]');
    return editable ? editable.innerText.trim() : '';
  } catch (err) {
    console.error("Error scraping email body:", err);
    return '';
  }
}

function replaceEmailBodyText(newText) {
  try {
    const editable = document.querySelector('[contenteditable="true"]');
    if (editable) editable.innerText = newText;
  } catch (err) {
    console.error("Error replacing email body:", err);
  }
}

async function importPrivateKey(pemKey) {
  const keyData = pemKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryDer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
}

async function rsaDecrypt(base64Cipher, privateKeyPem) {
  const privateKey = await importPrivateKey(privateKeyPem);
  const binary = Uint8Array.from(atob(base64Cipher), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, binary);
  return new TextDecoder().decode(decrypted);
}

document.getElementById("private-key-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    privateKeyText = text;

    if (privateKeyText.includes("-----BEGIN PRIVATE KEY-----")) {
      document.getElementById("key-status").textContent = "✅ Private key loaded.";
      document.getElementById("done-btn").disabled = false;
    } else {
      document.getElementById("key-status").textContent = "❌ Invalid PEM format.";
    }
  } catch (err) {
    console.error("Error reading key file:", err);
    document.getElementById("key-status").textContent = "❌ Failed to read file.";
  }
});

document.getElementById("done-btn").addEventListener("click", async () => {
  if (!privateKeyText) {
    alert("⚠️ Please upload your private key first.");
    return;
  }

  const encryptedText = getEmailBodyText();

  if (!encryptedText) {
    alert("⚠️ No email content found to decrypt.");
    return;
  }

  try {
    const decrypted = await rsaDecrypt(encryptedText, privateKeyText);
    replaceEmailBodyText(decrypted);

    alert("✅ Email decrypted successfully.");
    window.location.href = "main.html";
  } catch (err) {
    console.error("Decryption error:", err);
    alert("❌ Decryption failed. Make sure the email is valid and key is correct.");
  }
});

document.getElementById("back-btn").addEventListener("click", () => {
  window.history.back();
});
