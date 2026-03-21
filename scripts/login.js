document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.querySelector(".login-container");
  const signupBtn = document.getElementById("signupBtn");
  const backLogin = document.getElementById("backLogin");

  if (!loginContainer || !signupBtn || !backLogin) {
    return;
  }

  signupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginContainer.classList.add("signup-mode");
  });

  backLogin.addEventListener("click", (e) => {
    e.preventDefault();
    loginContainer.classList.remove("signup-mode");
  });
});
