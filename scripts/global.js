(() => {
  const STORAGE_KEY = "theme";
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
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
      }, 350);
    });
  }
})();