(async () => {
  const getRepoBasePath = () => {
    // Support both root-hosted and /repo-name hosted paths.
    const match = window.location.pathname.match(/^(.*)\/pages\/(mobile|desktop)\/[^/]+\.html$/i);
    return match ? match[1] : '';
  };

  const getLoginPath = () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const repoBasePath = getRepoBasePath();
    return isMobile ? `${repoBasePath}/pages/mobile/login.html` : `${repoBasePath}/pages/desktop/login.html`;
  };

  const redirectToLogin = () => {
    window.location.replace(getLoginPath());
  };

  const waitForAuth = async (timeoutMs = 5000, intervalMs = 100) => {
    const start = Date.now();
    while (!window.auth && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return Boolean(window.auth);
  };

  try {
    if (!window.auth) {
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      const hasAuth = await waitForAuth();
      if (!hasAuth) {
        redirectToLogin();
        return;
      }
    }

    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');

    onAuthStateChanged(window.auth, (user) => {
      if (!user) {
        redirectToLogin();
      }
    });
  } catch (error) {
    console.error('Auth guard error:', error);
    redirectToLogin();
  }
})();
