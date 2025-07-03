document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberMe = document.getElementById("rememberMe");
  const loginForm = document.getElementById("loginForm");

  const forgotLink = document.getElementById("forgotPasswordLink");
  const modal = document.getElementById("forgotPasswordModal");
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("closeModalBtn");
  const submitBtn = document.getElementById("submitResetBtn");

  // Autofill saved credentials
  if (localStorage.getItem("rememberMe") === "true") {
    emailInput.value = localStorage.getItem("email") || "";
    passwordInput.value = localStorage.getItem("password") || "";
    rememberMe.checked = true;
  }

  // Handle login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    if (rememberMe.checked) {
      localStorage.setItem("email", email);
      localStorage.setItem("password", password);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("email");
      localStorage.removeItem("password");
      localStorage.setItem("rememberMe", "false");
    }

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Login failed. Status:", res.status, "Body:", errorText);
        alert("Server error: " + res.status + ". Please try again.");
        return;
      }

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "dashboard.html";
      } else {
        alert("Login failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again.");
    }
  });

  // Show forgot password modal
  forgotLink.addEventListener("click", () => {
    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
  });

  // Handle password reset
  submitBtn.addEventListener("click", async () => {
    const resetEmail = document.getElementById("resetEmail").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!resetEmail || !newPassword || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/reset-password", {
        method: "POST", // ✅ Corrected method
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Reset failed. Status:", res.status, "Body:", errorText);
        alert("Server error: " + res.status + ". Try again.");
        return;
      }

      const result = await res.json();
      if (result.success) {
        alert("Password reset successful.");
        modal.classList.add("hidden");
        overlay.classList.add("hidden");
      } else {
        alert("Reset failed: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again.");
    }
  });
});
