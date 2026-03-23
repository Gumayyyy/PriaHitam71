(() => {
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener("click", () => {
      history.back();
    });
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", async () => {
      if (window.auth) {
        try {
          const { signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
          await signOut(window.auth);
          // Redirect to login after sign out
          window.location.href = "../login.html";
        } catch (error) {
          console.error("Error signing out:", error);
          // Still redirect even if error
          window.location.href = "../login.html";
        }
      } else {
        // Fallback if auth not loaded
        window.location.href = "../login.html";
      }
    });
  }
})();
