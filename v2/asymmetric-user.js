let publicKey = null;

document.getElementById("find-user-btn").addEventListener("click", async () => {
  const email = document.getElementById("recipient-email").value.trim();

  if (!email) {
    alert("⚠️ Please enter the recipient's email.");
    return;
  }

  try {
    console.log(`Fetching public key for: ${email}`);
    const res = await fetch(`http://localhost:3000/api/public-key?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (res.ok && data.publicKey) {
      publicKey = data.publicKey;
      document.getElementById("key-status").textContent = "✅ Public key found.";
      document.getElementById("done-btn").disabled = false;
      console.log("Public key retrieved successfully");
    } else {
      document.getElementById("key-status").textContent = "❌ Public key not found.";
      console.warn("Public key not found for email:", email);
    }
  } catch (err) {
    console.error("Fetch error:", err);
    document.getElementById("key-status").textContent = "❌ Error fetching public key.";
  }
});

document.getElementById("done-btn").addEventListener("click", async () => {
  console.log("Done button clicked");
  
  if (!publicKey) {
    alert("⚠️ No public key available.");
    return;
  }

  // Execute encryption in the context of the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) {
      alert("❌ No active tab found.");
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: injectEncryptAndRun,
      args: [publicKey]
    });
  });
});

document.getElementById("back-btn").addEventListener("click", () => {
  window.history.back();
});

// This function will be serialized and executed in the context of the webpage
function injectEncryptAndRun(publicKeyPem) {
  async function getEmailBodyText() {
    try {
      console.log("Looking for email content...");
      
      // Special handling for Outlook
      if (location.host.includes("outlook")) {
        console.log("Using Outlook-specific extraction");
        
        const outlookElement = document.querySelector('div.elementToProof');
        if (outlookElement) {
          const text = outlookElement.innerText.trim();
          console.log("✅ Found Outlook content in elementToProof:", text);
          return text;
        }
      }
      
      // Log each selector attempt
      const selectors = [
        'div#\\:167.editable', // Gmail composing
        '[contenteditable="true"]', // General composing
        'div[tabindex="0"][role="textbox"][aria-label*="Message body"]', // Gmail composing
        'div.a3s.aiL', // Gmail reading
        'div.dFCbN[contenteditable="true"]', // Outlook composing
        'div.elementToProof' // Outlook reading
      ];
      
      // Add a small delay and then check for contenteditable elements
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay to give time for content load
  
      let emailBody = "";
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        console.log(`Checking selector "${selector}":`, el ? "Found" : "Not Found");
        
        if (el) {
          emailBody = el.innerText.trim();
          if (emailBody) {
            console.log("✅ Found email content");
            break;
          }
        }
      }
  
      if (!emailBody) {
        console.warn("⚠️ No matching content found.");
        return '';
      }
      return emailBody;
    } catch (err) {
      console.error("❌ Error scraping email body:", err);
      return '';
    }
  }
  

  function replaceEmailBodyText(newText) {
    try {
      console.log("Attempting to replace email content...");
      
      // Use the same comprehensive selector strategy
      const editable = 
      document.querySelector('div#\\:167.editable') || // Gmail composing
      document.querySelector('div.elementToProof') || // Outlook - MOVED UP for priority
      document.querySelector('[contenteditable="true"]') || // General composing
      document.querySelector('div[tabindex="0"][role="textbox"][aria-label*="Message body"]') || 
      document.querySelector('div.a3s.aiL') || // Gmail reading
      document.querySelector('div.dFCbN[contenteditable="true"]'); // Outlook composing alternative

      if (editable) {
        editable.focus();
        
        // Handle both Gmail and Outlook with appropriate content setting
        if (location.host.includes("mail.google.com")) {
          console.log("Setting content for Gmail");
          editable.innerHTML = newText.replace(/\n/g, '<br>');
          console.log("✅ Gmail content replaced");
        } else {
          console.log("Setting content for Outlook/other");
          editable.innerText = newText;
          console.log("✅ Outlook/other content replaced");
        }
        return true;
      } else {
        console.error("❌ No editable element found for replacement");
        return false;
      }
    } catch (err) {
      console.error("❌ Error replacing email body:", err);
      return false;
    }
  }

  async function importPublicKey(pemKey) {
    try {
      console.log("Importing public key...");
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
    } catch (err) {
      console.error("❌ Error importing public key:", err);
      throw new Error("Failed to import public key");
    }
  }

  async function rsaEncrypt(text, publicKeyPem) {
    try {
      console.log("Starting encryption...");
      const pubKey = await importPublicKey(publicKeyPem);
      console.log("Public key imported successfully");
      
      const encoded = new TextEncoder().encode(text);
      console.log("Text encoded, length:", encoded.length);
      
      const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, encoded);
      console.log("Encryption successful");
      
      return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (err) {
      console.error("❌ Encryption failed:", err);
      throw err;
    }
  }

  // Main execution
  (async function() {
    try {
      const text = await getEmailBodyText();
      
      if (!text) {
        alert("⚠️ No email content found to encrypt.");
        return;
      }
      
      console.log("Starting RSA encryption process...");
      const encrypted = await rsaEncrypt(text, publicKeyPem);
      console.log("RSA encryption complete, replacing text...");
      const success = replaceEmailBodyText(encrypted);
      
      if (success) {
        alert("✅ RSA Encryption complete.");
      } else {
        alert("❌ Could not find email body to replace.");
      }
    } catch (err) {
      console.error("Encryption error details:", err);
      alert("❌ RSA Encryption failed: " + err.message);
    }
  })();
}