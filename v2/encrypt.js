document.getElementById("symmetric-btn").addEventListener("click", () => {
    localStorage.setItem("mode", "encrypt");
    window.location.href = "symmetric-technique.html";
  });
  
  document.getElementById("asymmetric-btn").addEventListener("click", () => {
    localStorage.setItem("mode", "encrypt");
    window.location.href = "asymmetric-type.html";
  });
  
  document.getElementById("back-btn").addEventListener("click", () => {
    window.history.back();
  });
  