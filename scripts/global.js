(() => {
  const STORAGE_KEY = "theme";
  const THEME_TRANSITION_MS = 450;
  const body = document.body;
  const toggleCheckbox = document.getElementById("toggleMode");

  function applyTheme(theme) {
    const isDark = theme === "dark";
    body.classList.toggle("dark-mode", isDark);
    if (toggleCheckbox) {
      toggleCheckbox.checked = isDark;
    }
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  // Apply theme without transition on page load
  body.classList.add("no-transition");
  applyTheme(getPreferredTheme());

  // Remove no-transition class after a tick to enable transitions
  requestAnimationFrame(() => {
    body.classList.remove("no-transition");
  });

  if (toggleCheckbox) {
    toggleCheckbox.addEventListener("change", () => {
      const next = toggleCheckbox.checked ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);

      // Enable smooth transition
      body.classList.add("theme-transition");
      applyTheme(next);

      // Remove transition class after animation completes
      setTimeout(() => {
        body.classList.remove("theme-transition");
      }, THEME_TRANSITION_MS);
    });
  }
})();

const showSocial = (btnId, socialId) => {
  const btn = document.getElementById(btnId),
    social = document.getElementById(socialId);

  if (!btn || !social) return;

  btn.addEventListener("click", () => {
    const isOpen = social.classList.toggle("show-social");
    btn.classList.toggle("show-close", isOpen);
  });
};
showSocial("user-btn", "user-social");

// Function to load user data
const loadUserData = async () => {
  const ensureFirebaseContext = async () => {
    if (window.auth && window.db) return true;

    try {
      const { initializeApp, getApps, getApp } =
        await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
      const { getAuth } =
        await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      const { getFirestore } =
        await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

      const firebaseConfig = {
        apiKey: "AIzaSyCI1lghCfgBf5S-PEfZ_6DEHaSYu76aUT4",
        authDomain: "priahitam71-000000.firebaseapp.com",
        projectId: "priahitam71-000000",
        storageBucket: "priahitam71-000000.firebasestorage.app",
        messagingSenderId: "543874144759",
        appId: "1:543874144759:web:d55e0dd1bc7f2d201276f2",
        measurementId: "G-JS7VFF76YX",
      };

      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      window.auth = getAuth(app);
      window.db = getFirestore(app);
      return true;
    } catch (error) {
      console.error("Firebase init error:", error);
      return false;
    }
  };

  const waitForFirebaseContext = async (maxAttempts = 30, delayMs = 100) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (window.auth && window.db) return true;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return false;
  };

  const initialized = await ensureFirebaseContext();
  const isReady = initialized || (await waitForFirebaseContext());
  if (!isReady) return;

  const { onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
  const { doc, getDoc } =
    await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

  onAuthStateChanged(window.auth, async (user) => {
    if (user) {
      try {
        let username =
          user.displayName || user.email?.split("@")[0] || "Student";

        const userDoc = await getDoc(doc(window.db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          username = userData.username || username;
        }

        // Update all user-name elements
        const userNameElements = document.querySelectorAll(".user-name");
        userNameElements.forEach((el) => {
          el.textContent = username;
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
  });
};

document.addEventListener("DOMContentLoaded", loadUserData);

// Load user data when DOM is ready
document.addEventListener("DOMContentLoaded", loadUserData);

(() => {
  const TABLET_MIN_SHORT_EDGE = 600;
  const TABLET_MAX_LONG_EDGE = 1800;
  const SYNC_RETRY_DELAYS = [0, 120, 260, 520, 900];
  const KEYBOARD_HEIGHT_THRESHOLD = 120;

  let redirectTimer = null;
  let retryTimers = [];

  function getCurrentLayout(pathname) {
    if (/\/pages\/mobile\/[^/]+\.html$/i.test(pathname)) return "mobile";
    if (/\/pages\/desktop\/[^/]+\.html$/i.test(pathname)) return "desktop";
    return null;
  }

  function getViewportSize() {
    // Use layout viewport size so on-screen keyboard changes do not fake rotation.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return { vw, vh };
  }

  function isFormFieldFocused() {
    const el = document.activeElement;
    if (!el) return false;
    if (el instanceof HTMLInputElement) return true;
    if (el instanceof HTMLTextAreaElement) return true;
    if (el instanceof HTMLSelectElement) return true;
    return el.isContentEditable;
  }

  function isVirtualKeyboardActive() {
    if (!window.visualViewport) return false;
    if (!isFormFieldFocused()) return false;
    return (
      window.innerHeight - window.visualViewport.height >
      KEYBOARD_HEIGHT_THRESHOLD
    );
  }

  function getOrientationMode() {
    const orientationType = window.screen?.orientation?.type;
    if (orientationType) {
      return orientationType.includes("landscape") ? "landscape" : "portrait";
    }

    if (window.matchMedia("(orientation: portrait)").matches) {
      return "portrait";
    }

    return window.matchMedia("(orientation: landscape)").matches
      ? "landscape"
      : "portrait";
  }

  function isTabletLikeViewport() {
    const { vw, vh } = getViewportSize();
    const shortEdge = Math.min(vw, vh);
    const longEdge = Math.max(vw, vh);
    return (
      shortEdge >= TABLET_MIN_SHORT_EDGE && longEdge <= TABLET_MAX_LONG_EDGE
    );
  }

  function getTargetLayout(currentLayout) {
    if (!isTabletLikeViewport()) return null;

    const orientation = getOrientationMode();

    if (currentLayout === "mobile" && orientation === "landscape")
      return "desktop";
    if (currentLayout === "desktop" && orientation === "portrait")
      return "mobile";

    return currentLayout;
  }

  function buildTargetPath(pathname, targetLayout) {
    if (!targetLayout) return null;
    return pathname.replace(
      /\/pages\/(mobile|desktop)\//i,
      `/pages/${targetLayout}/`,
    );
  }

  function syncTabletOrientationLayout() {
    if (isVirtualKeyboardActive()) return;

    const pathname = window.location.pathname;
    const currentLayout = getCurrentLayout(pathname);

    if (!currentLayout) return;

    const targetLayout = getTargetLayout(currentLayout);
    if (!targetLayout || targetLayout === currentLayout) return;

    const targetPath = buildTargetPath(pathname, targetLayout);
    if (!targetPath || targetPath === pathname) return;

    window.location.replace(targetPath);
  }

  function clearRetryTimers() {
    retryTimers.forEach((timerId) => clearTimeout(timerId));
    retryTimers = [];
  }

  function runScheduledSyncPasses() {
    clearRetryTimers();
    SYNC_RETRY_DELAYS.forEach((delay) => {
      const timerId = setTimeout(syncTabletOrientationLayout, delay);
      retryTimers.push(timerId);
    });
  }

  function scheduleLayoutSync() {
    if (isVirtualKeyboardActive()) return;

    if (redirectTimer) clearTimeout(redirectTimer);
    redirectTimer = setTimeout(runScheduledSyncPasses, 90);
  }

  window.addEventListener("orientationchange", scheduleLayoutSync, {
    passive: true,
  });
  window.addEventListener("resize", scheduleLayoutSync, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleLayoutSync, {
      passive: true,
    });
  }

  // Re-check once keyboard is dismissed.
  document.addEventListener("focusout", scheduleLayoutSync, { passive: true });

  if (window.screen?.orientation?.addEventListener) {
    window.screen.orientation.addEventListener("change", scheduleLayoutSync);
  }

  // Initial check in case user opens a page directly on tablet orientation.
  runScheduledSyncPasses();
})();
