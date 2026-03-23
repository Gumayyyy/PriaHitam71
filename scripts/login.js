import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.querySelector(".login-container");
  const signupBtn = document.getElementById("signupBtn");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const backLogin = document.getElementById("backLogin");
  const backFromForgot = document.getElementById("backFromForgot");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  // Toggle between login and signup
  signupBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    loginContainer?.classList.remove("forgot-mode");
    loginContainer?.classList.add("signup-mode");
  });

  backLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    loginContainer?.classList.remove("forgot-mode");
    loginContainer?.classList.remove("signup-mode");
  });

  forgotPasswordBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    loginContainer?.classList.remove("signup-mode");
    loginContainer?.classList.add("forgot-mode");
  });

  backFromForgot?.addEventListener("click", (e) => {
    e.preventDefault();
    loginContainer?.classList.remove("forgot-mode");
    loginContainer?.classList.remove("signup-mode");
  });

  // LOGIN
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorDiv = document.getElementById("loginError");

    try {
      errorDiv.textContent = "";
      const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
      // Login successful - redirect to home
      window.location.href = "pages/home.html";
    } catch (error) {
      errorDiv.textContent = error.message;
      console.error("Login error:", error);
    }
  });

  // SIGNUP
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("fullName").value;
    const username = document.getElementById("nickname").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorDiv = document.getElementById("signupError");

    // Validate passwords match
    if (password !== confirmPassword) {
      errorDiv.textContent = "Passwords do not match!";
      return;
    }

    if (password.length < 6) {
      errorDiv.textContent = "Password must be at least 6 characters!";
      return;
    }

    try {
      errorDiv.textContent = "";
      const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
      
      // Update user profile with full name
      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      // Save user data to Firestore
      await setDoc(doc(window.db, "users", userCredential.user.uid), {
        fullName: fullName,
        username: username,
        email: email
      });

      // Signup successful - redirect to home
      window.location.href = "pages/home.html";
    } catch (error) {
      errorDiv.textContent = error.message;
      console.error("Signup error:", error);
    }
  });
});