document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    const errorDiv = document.getElementById("loginError");

    // API base (CloudFront / backend)
    const API_BASE = "https://dvbwohodr9qxd.cloudfront.net";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user_id = document.getElementById("user_id").value.trim();
        const password = document.getElementById("password").value.trim();

        errorDiv.style.display = "none";
        errorDiv.textContent = "";

        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ user_id, password })
            });

            const data = await res.json();

            if (!res.ok) {
                errorDiv.textContent = data.error || "Login failed";
                errorDiv.style.display = "block";
                return;
            }

            // Save auth info
            localStorage.setItem("token", data.token);
            localStorage.setItem("currentUser", JSON.stringify(data.user));

            console.log("Login successful:", data.user);

            // ✅ ROLE-BASED REDIRECT
            if (data.user.role === "admin") {
                window.location.href = "/admin/admin.html";
            } else {
                window.location.href = "/dashboard.html";
            }

        } catch (err) {
            console.error("Login Error:", err);
            errorDiv.textContent = "Server is unreachable!";
            errorDiv.style.display = "block";
        }
    });

});
