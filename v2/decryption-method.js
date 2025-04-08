document.getElementById("symmetric-decrypt").addEventListener("click", () => {
    localStorage.setItem("mode", "decrypt");
    window.location.href = "symmetric-technique.html";
  });
  
  document.getElementById("asymmetric-decrypt").addEventListener("click", () => {
    localStorage.setItem("mode", "decrypt");
    window.location.href = "asymmetric-key-upload.html";
  });
  
  document.getElementById("back-btn").addEventListener("click", () => {
    window.history.back();
  });
  