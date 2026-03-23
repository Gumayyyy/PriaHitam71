(() => {
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener("click", () => {
      history.back();
    });
  }
})();
