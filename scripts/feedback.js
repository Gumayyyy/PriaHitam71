document.addEventListener("DOMContentLoaded", () => {
  const feedbackForm = document.querySelector(".contact-container form");
  const submitBtn = document.querySelector(".btn-input input[type='submit']");
  const fullnameInput = document.getElementById("fullname");
  const dateInput = document.getElementById("date");
  const messageTextarea = document.getElementById("message");

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  // Handle form submission
  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form values
    const fullname = fullnameInput.value.trim();
    const date = dateInput.value;
    const message = messageTextarea.value.trim();

    // Basic validation
    if (!fullname) {
      showMessage("Please enter your name", "error");
      fullnameInput.focus();
      return;
    }

    if (!message) {
      showMessage("Please enter your message", "error");
      messageTextarea.focus();
      return;
    }

    // Disable submit button during submission
    submitBtn.disabled = true;
    submitBtn.value = "Sending...";

    try {
      // Prepare feedback data
      const feedbackData = {
        fullname: fullname,
        date: date,
        message: message,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Add user info if logged in
      if (window.auth && window.auth.currentUser) {
        const user = window.auth.currentUser;
        feedbackData.userId = user.uid;
        feedbackData.userEmail = user.email;
        feedbackData.isAuthenticated = true;
      } else {
        feedbackData.isAuthenticated = false;
      }

      // Save to Firestore
      const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

      await addDoc(collection(window.db, "feedback"), feedbackData);

      // Success
      showMessage("Thank you for your feedback! We'll get back to you soon.", "success");

      // Clear form
      feedbackForm.reset();
      dateInput.value = today; // Reset date to today

    } catch (error) {
      console.error("Error sending feedback:", error);
      showMessage("Failed to send feedback. Please try again.", "error");
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.value = "Send";
    }
  });
});

// Function to show messages to user
function showMessage(message, type) {
  // Remove any existing message
  const existingMessage = document.querySelector(".feedback-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `feedback-message ${type}`;
  messageDiv.textContent = message;

  // Style the message
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;

  if (type === "success") {
    messageDiv.style.backgroundColor = "#10b981"; // Green
  } else {
    messageDiv.style.backgroundColor = "#ef4444"; // Red
  }

  // Add to page
  document.body.appendChild(messageDiv);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}

// Auto-resize textarea as user types
document.addEventListener("DOMContentLoaded", () => {
  const messageTextarea = document.getElementById("message");

  if (messageTextarea) {
    messageTextarea.addEventListener("input", function() {
      this.style.height = "auto";
      this.style.height = (this.scrollHeight) + "px";
    });
  }
});