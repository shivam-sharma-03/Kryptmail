// Ensure script runs only after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // ✅ Check login status
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn || isLoggedIn !== "true") {
      window.location.href = "login.html";
      return;
    }
  
    // ✅ Encrypt button
    document.getElementById("encrypt-btn").addEventListener("click", () => {
      window.location.href = "encrypt.html";
    });
  
    // ✅ Decrypt button
    document.getElementById("decrypt-btn").addEventListener("click", () => {
      window.location.href = "decryption-method.html";
    });
  
    // ✅ Logout button
    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("emailCipherUser");
      window.location.href = "login.html";
    });
  });
  