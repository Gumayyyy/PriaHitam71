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
  if (!window.auth || !window.db) return;

  const { onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
  const { doc, getDoc } =
    await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

  onAuthStateChanged(window.auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(window.db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const username = userData.username;
          // Update all user-name elements
          const userNameElements = document.querySelectorAll(".user-name");
          userNameElements.forEach((el) => {
            el.textContent = username;
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
  });
};

// Load user data when DOM is ready
document.addEventListener("DOMContentLoaded", loadUserData);
