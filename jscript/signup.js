document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const errorDiv = document.getElementById("signupError");
    errorDiv.style.display = "none";

    // ✅ Explicit DOM bindings (CRITICAL FIX)
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const gradeInput = document.getElementById("grade");
    const sectionInput = document.getElementById("section");
    const schoolInput = document.getElementById("school");

    const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        grade: gradeInput.value,
        section: sectionInput.value.trim(),
        school: schoolInput.value
    };

    if (passwordInput.value !== confirmPasswordInput.value) {
        errorDiv.textContent = "Passwords do not match";
        errorDiv.style.display = "block";
        return;
    }

    const res = await fetch("https://dvbwohodr9qxd.cloudfront.net/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
        errorDiv.textContent = data.error || "Signup failed";
        errorDiv.style.display = "block";
        return;
    }

    // ✅ Success
    window.location.href = "login.html";
});