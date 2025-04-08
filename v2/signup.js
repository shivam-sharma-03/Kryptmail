document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate-key-btn");
  const signupForm = document.getElementById("signup-form");

  generateBtn.addEventListener("click", generateKeyPair);
  signupForm.addEventListener("submit", signupUser);

  async function generateKeyPair() {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
      const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

      const publicPem = convertToPem(publicKey, "PUBLIC KEY");
      const privatePem = convertToPem(privateKey, "PRIVATE KEY");

      document.getElementById("public-key").value = publicPem;

      // Download private key
      const blob = new Blob([privatePem], { type: "application/x-pem-file" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "private-key.pem";
      document.body.appendChild(link); // iOS fix
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Key generation failed:", err);
      alert("Failed to generate key pair.");
    }
  }

  function convertToPem(buffer, label) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const chunks = base64.match(/.{1,64}/g).join("\n");
    return `-----BEGIN ${label}-----\n${chunks}\n-----END ${label}-----`;
  }

  async function signupUser(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const publicKey = document.getElementById("public-key").value.trim();

    if (!email || !password || !confirmPassword || !publicKey) {
      alert("Please complete all fields and generate your key pair.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, publicKey }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup successful! Please log in.");
        window.location.href = "login.html";
      } else {
        alert(data.error || "Signup failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("An error occurred during signup.");
    }
  }
});
