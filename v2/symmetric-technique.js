function goToKeyPage(technique) {
    localStorage.setItem('symmetricTechnique', technique);
    window.location.href = 'symmetric-key.html';
  }
  
  document.getElementById('caesar-btn').addEventListener('click', () => goToKeyPage('caesar'));
  document.getElementById('railfence-btn').addEventListener('click', () => goToKeyPage('railfence'));
  document.getElementById('vigenere-btn').addEventListener('click', () => goToKeyPage('vigenere'));
  
  document.getElementById('back-btn').addEventListener('click', () => {
    window.history.back();
  });
  