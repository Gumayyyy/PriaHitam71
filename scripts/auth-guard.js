(async () => {
  try {
    if (!window.auth) {
      // If auth is not available, redirect to login
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const loginPath = isMobile ? "/pages/mobile/login.html" : "/pages/desktop/login.html";
      window.location.href = loginPath;
      return;
    }

    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");

    onAuthStateChanged(window.auth, (user) => {
      if (!user) {
        // No user is logged in, redirect to login
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const loginPath = isMobile ? "/pages/mobile/login.html" : "/pages/desktop/login.html";
        window.location.href = loginPath;
      }
    });
  } catch (error) {
    console.error("Auth guard error:", error);
    
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const loginPath = isMobile ? "/pages/mobile/login.html" : "/pages/desktop/login.html";
    window.location.href = loginPath;
  }
})();