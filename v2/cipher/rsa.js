async function importPublicKey(pemKey) {
  const keyData = pemKey
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\n/g, "");
  const binaryDer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
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
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  );
}

async function rsaEncrypt(text, publicKeyPem) {
  const publicKey = await importPublicKey(publicKeyPem);
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoded);
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

async function rsaDecrypt(base64Cipher, privateKeyPem) {
  const privateKey = await importPrivateKey(privateKeyPem);
  const binary = Uint8Array.from(atob(base64Cipher), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, binary);
  return new TextDecoder().decode(decrypted);
}

function isValidPemKey(key, type = 'PRIVATE') {
  const header = `-----BEGIN ${type} KEY-----`;
  const footer = `-----END ${type} KEY-----`;
  return key.includes(header) && key.includes(footer);
}
