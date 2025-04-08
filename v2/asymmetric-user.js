let publicKey = null;

function getEmailBodyText() {
  try {
    // Gmail
    const gmailEditable = document.querySelector('[contenteditable="true"].editable');
    if (gmailEditable && gmailEditable.innerText.trim()) {
      console.log("✅ Found Gmail content");
      return gmailEditable.innerText.trim();
    }

    // Outlook
    const outlookElement = document.querySelector('.elementToProof');
    if (outlookElement && outlookElement.innerText.trim()) {
      console.log("✅ Found Outlook content");
      return outlookElement.innerText.trim();
    }

    // Fallback: largest visible editable
    const all = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
    const largest = all.reduce((max, el) => {
      return el.innerText.length > max.innerText.length ? el : max;
    }, { innerText: '' });

    if (largest && largest.innerText.trim()) {
      console.log("⚠️ Using fallback editable div");
      return largest.innerText.trim();
    }

    console.warn("⚠️ No matching content found.");
    return '';
  } catch (err) {
    console.error("❌ Error scraping email body:", err);
    return '';
  }
}

function replaceEmailBodyText(newText) {
  try {
    let replaced = false;

    // Gmail
    const gmailBody = document.querySelector('[contenteditable="true"].editable');
    if (gmailBody) {
      gmailBody.focus();
      gmailBody.innerHTML = newText.replace(/\n/g, '<br>');
      console.log("✅ Gmail body replaced.");
      replaced = true;
    }

    // Outlook
    const outlookBody = document.querySelector('.elementToProof');
    if (outlookBody && !replaced) {
      outlookBody.focus();
      outlookBody.innerHTML = newText.replace(/\n/g, '<br>');
      console.log("✅ Outlook body replaced.");
      replaced = true;
    }

    // Fallback
    if (!replaced) {
      const all = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
      const largest = all.reduce((max, el) => {
        return el.innerText.length > max.innerText.length ? el : max;
      }, { innerText: '' });

      if (largest) {
        largest.focus();
        largest.innerHTML = newText.replace(/\n/g, '<br>');
        console.log("✅ Fallback body replaced.");
        replaced = true;
      }
    }

    if (!replaced) {
      alert("❌ Could not find email body to replace.");
    }
  } catch (err) {
    console.error("❌ Error replacing email body:", err);
    alert("❌ Failed to replace encrypted content.");
  }
}

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

document.getElementById("done-btn").addEventListener("click", async () => {
  if (!publicKey) {
    alert("⚠️ No public key available.");
    return;
  }

  const text = getEmailBodyText();

  if (!text) {
    alert("⚠️ No email content found to encrypt.");
    return;
  }

  try {
    const encrypted = await rsaEncrypt(text, publicKey);
    replaceEmailBodyText(encrypted);
    alert("✅ RSA Encryption complete.");
    window.location.href = "main.html";
  } catch (err) {
    console.error("Encryption error:", err);
    alert("❌ RSA Encryption failed.");
  }
});

document.getElementById("back-btn").addEventListener("click", () => {
  window.history.back();
});
