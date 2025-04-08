let publicKey = null;

document.getElementById("find-user-btn").addEventListener("click", async () => {
  const email = document.getElementById("recipient-email").value.trim();

  if (!email) {
    alert("⚠️ Please enter the recipient's email.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/public-key?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (res.ok && data.publicKey) {
      publicKey = data.publicKey;
      document.getElementById("key-status").textContent = "✅ Public key found.";
      document.getElementById("done-btn").disabled = false;
    } else {
      document.getElementById("key-status").textContent = "❌ Public key not found.";
    }
  } catch (err) {
    console.error("Fetch error:", err);
    document.getElementById("key-status").textContent = "❌ Error fetching public key.";
  }
});

document.getElementById("done-btn").addEventListener("click", () => {
  if (!publicKey) {
    alert("⚠️ No public key available.");
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectAsymmetricEncryptAndRun,
      args: [publicKey],
    });
  });
});

document.getElementById("back-btn").addEventListener("click", () => {
  window.history.back();
});

// 🧠 Injected function that runs inside the email page
async function injectAsymmetricEncryptAndRun(publicKeyPem) {
  async function importPublicKey(pemKey) {
    const keyData = pemKey
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\n/g, "");
    const binaryDer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

    return crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );
  }

  async function rsaEncrypt(text, publicKeyPem) {
    const pubKey = await importPublicKey(publicKeyPem);
    const encoded = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, encoded);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  function getEditableContent() {
    const gmail = document.querySelector('[contenteditable="true"].editable');
    if (gmail && gmail.innerText.trim()) return gmail;

    const outlook = document.querySelector('.elementToProof');
    if (outlook && outlook.innerText.trim()) return outlook;

    const all = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
    const largest = all.reduce((max, el) => el.innerText.length > max.innerText.length ? el : max, { innerText: '' });
    return largest.innerText.trim() ? largest : null;
  }

  const editable = getEditableContent();
  if (!editable) {
    alert("❌ No editable email body found.");
    return;
  }

  const text = editable.innerText.trim();
  if (!text) {
    alert("⚠️ No email content found to encrypt.");
    return;
  }

  try {
    const encrypted = await rsaEncrypt(text, publicKeyPem);
    editable.focus();
    editable.innerHTML = encrypted.replace(/\n/g, '<br>');
    alert("✅ RSA Encryption complete.");
  } catch (err) {
    console.error("Encryption error:", err);
    alert("❌ RSA Encryption failed.");
  }
}
