let privateKeyText = '';

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

  // Execute decryption in the context of the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) {
      alert("❌ No active tab found.");
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: injectDecryptAndRun,
      args: [privateKeyText]
    });
  });
});

document.getElementById("back-btn").addEventListener("click", () => {
  window.history.back();
});

// This function will be serialized and executed in the context of the webpage
function injectDecryptAndRun(privateKeyPem) {
  // Helper function to log element details for debugging
  function logElementDetails(element, label) {
    if (!element) {
      console.log(`${label}: Element not found`);
      return;
    }
    
    console.log(`${label}: Found element`);
    console.log(`- Tag: ${element.tagName}`);
    console.log(`- Classes: ${element.className}`);
    console.log(`- Content length: ${element.innerText.trim().length}`);
    console.log(`- First 50 chars: "${element.innerText.trim().substring(0, 50)}..."`);
    
    // Log parent details too
    if (element.parentElement) {
      console.log(`- Parent tag: ${element.parentElement.tagName}`);
      console.log(`- Parent classes: ${element.parentElement.className}`);
    }
  }

  async function getEmailBodyText() {
    try {
      console.log("Looking for email content to decrypt...");
      
      // Platform-specific logic for better content selection
      if (location.host.includes("outlook")) {
        console.log("Using Outlook-specific content extraction");
        
        // Find ALL elementToProof elements and log them
        const allOutlookElements = document.querySelectorAll('div.elementToProof');
        console.log(`Found ${allOutlookElements.length} elementToProof elements`);
        
        // Log each one for debugging
        allOutlookElements.forEach((el, index) => {
          console.log(`Element ${index + 1}:`);
          logElementDetails(el, `Outlook element ${index + 1}`);
        });
        
        // If there are multiple elements, try to find the one with encrypted content
        if (allOutlookElements.length > 0) {
          // Try to find an element that looks like encrypted content (base64)
          for (const el of allOutlookElements) {
            const text = el.innerText.trim();
            // Base64 content typically has no spaces and is longer
            if (text.length > 20 && !text.includes(' ')) {
              console.log("Found likely encrypted content (no spaces, longer text)");
              return text;
            }
          }
          
          // If no element looks like encrypted content, return the first one
          return allOutlookElements[0].innerText.trim();
        }
        
        // Try direct parent approach
        console.log("Trying alternative Outlook selector - parent of elementToProof");
        const outlookParent = document.querySelector('div.dFCbN[contenteditable="true"]');
        if (outlookParent) {
          // Try to find only the encrypted part within the parent
          const content = outlookParent.innerText.trim();
          const lines = content.split('\n').filter(line => line.trim());
          
          // Find the longest line without spaces (likely the encrypted part)
          let encryptedLine = '';
          let maxLength = 0;
          
          for (const line of lines) {
            if (line.length > maxLength && !line.includes(' ')) {
              maxLength = line.length;
              encryptedLine = line;
            }
          }
          
          if (encryptedLine) {
            console.log("Found likely encrypted line within content");
            return encryptedLine;
          }
          
          return content;
        }
      }
      
      // Log each selector attempt
      const selectors = [
        'div#\\:167.editable',
        'div.elementToProof',
        '[contenteditable="true"]',
        'div[tabindex="0"][role="textbox"][aria-label*="Message body"]',
        'div.a3s.aiL',
        'div.dFCbN[contenteditable="true"]'
      ];
      
      selectors.forEach(selector => {
        const el = document.querySelector(selector);
        console.log(`Selector "${selector}": ${el ? "✓ FOUND" : "✗ NOT FOUND"}`);
      });
      
      // Use comprehensive selector strategy with correct order
      const editable = 
        document.querySelector('div#\\:167.editable') || // Gmail composing
        document.querySelector('div.elementToProof') || // Outlook - prioritized
        document.querySelector('[contenteditable="true"]') || // General composing
        document.querySelector('div[tabindex="0"][role="textbox"][aria-label*="Message body"]') || 
        document.querySelector('div.a3s.aiL') || // Gmail reading
        document.querySelector('div.dFCbN[contenteditable="true"]'); // Outlook alternative

      if (editable && editable.innerText.trim()) {
        logElementDetails(editable, "Selected editable element");
        
        // If the selected element has potentially multiple parts (Outlook),
        // try to extract only the encrypted part
        const text = editable.innerText.trim();
        const lines = text.split('\n').filter(line => line.trim());
        
        // If there are multiple lines, look for one that looks like encrypted content
        if (lines.length > 1) {
          for (const line of lines) {
            // Look for a line that has no spaces and is longer (likely encrypted)
            if (line.length > 20 && !line.includes(' ')) {
              console.log("Found likely encrypted line in multiline content");
              return line;
            }
          }
        }
        
        console.log("✅ Found encrypted email content");
        console.log("Content length:", text.length);
        return text;
      }

      console.warn("⚠️ No matching content found to decrypt.");
      return '';
    } catch (err) {
      console.error("❌ Error scraping email body:", err);
      return '';
    }
  }

  function replaceEmailBodyText(newText) {
    try {
      console.log("Attempting to replace email content with decrypted text...");
      
      // Special handling for Outlook
      if (location.host.includes("outlook")) {
        const allOutlookElements = document.querySelectorAll('div.elementToProof');
        console.log(`Found ${allOutlookElements.length} elementToProof elements for replacement`);
        
        if (allOutlookElements.length > 0) {
          // Try to find which one had the encrypted content
          for (const el of allOutlookElements) {
            const text = el.innerText.trim();
            // Look for an element that might have contained base64 (no spaces, longer text)
            if (text.length > 20 && !text.includes(' ')) {
              console.log("Found likely element that had encrypted content");
              el.innerText = newText;
              console.log("✅ Outlook content replaced directly");
              return true;
            }
          }
          
          // If we can't determine which one had encrypted content, update the first one
          allOutlookElements[0].innerText = newText;
          console.log("✅ Outlook content replaced (first element)");
          return true;
        }
        
        // Try the parent approach
        const outlookParent = document.querySelector('div.dFCbN[contenteditable="true"]');
        if (outlookParent) {
          outlookParent.innerText = newText;
          console.log("✅ Outlook content replaced (parent element)");
          return true;
        }
      }
      
      // Use same selector strategy with correct priority
      const editable = 
        document.querySelector('div#\\:167.editable') || // Gmail composing
        document.querySelector('div.elementToProof') || // Outlook - prioritized
        document.querySelector('[contenteditable="true"]') || // General composing
        document.querySelector('div[tabindex="0"][role="textbox"][aria-label*="Message body"]') || 
        document.querySelector('div.a3s.aiL') || // Gmail reading
        document.querySelector('div.dFCbN[contenteditable="true"]'); // Outlook alternative

      if (editable) {
        editable.focus();
        
        // Handle both Gmail and Outlook with appropriate content setting
        if (location.host.includes("mail.google.com")) {
          console.log("Setting decrypted content for Gmail");
          editable.innerHTML = newText.replace(/\n/g, '<br>');
          console.log("✅ Gmail content replaced with decrypted text");
        } else {
          console.log("Setting decrypted content for Outlook/other");
          editable.innerText = newText;
          console.log("✅ Outlook/other content replaced with decrypted text");
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

  async function importPrivateKey(pemKey) {
    try {
      console.log("Importing private key...");
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
    } catch (err) {
      console.error("❌ Error importing private key:", err);
      throw new Error("Failed to import private key");
    }
  }

  async function rsaDecrypt(base64Cipher, privateKeyPem) {
    try {
      console.log("Starting decryption...");
      const privateKey = await importPrivateKey(privateKeyPem);
      console.log("Private key imported successfully");
      
      const binary = Uint8Array.from(atob(base64Cipher), c => c.charCodeAt(0));
      console.log("Cipher text decoded, length:", binary.length);
      
      const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, binary);
      console.log("Decryption successful");
      
      return new TextDecoder().decode(decrypted);
    } catch (err) {
      console.error("❌ Decryption failed:", err);
      throw err;
    }
  }

  // Main execution
  (async function() {
    try {
      const encryptedText = await getEmailBodyText();
      
      if (!encryptedText) {
        alert("⚠️ No email content found to decrypt.");
        return;
      }
      
      console.log("Starting RSA decryption process...");
      const decrypted = await rsaDecrypt(encryptedText, privateKeyPem);
      console.log("RSA decryption complete, replacing text...");
      const success = replaceEmailBodyText(decrypted);
      
      if (success) {
        alert("✅ Email decrypted successfully.");
      } else {
        alert("❌ Could not find email body to replace.");
      }
    } catch (err) {
      console.error("Decryption error details:", err);
      alert("❌ Decryption failed: " + err.message);
    }
  })();
}