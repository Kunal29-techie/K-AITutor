// CHANGED: Empty string for relative path (works on EC2/Nginx)
        const API_BASE = "https://dvbwohodr9qxd.cloudfront.net"; 
        const token = localStorage.getItem("token");

        // CHECK LOGIN STATUS
        if (!token) {
            window.location.href = "login.html";
        }

        document.getElementById("changePassForm").addEventListener("submit", async (e) => {
            e.preventDefault();

            const oldPass = document.getElementById("oldPass").value;
            const newPass = document.getElementById("newPass").value;
            const confirmPass = document.getElementById("confirmPass").value;

            // Validation
            if (newPass !== confirmPass) {
                alert("New passwords do not match!");
                return;
            }

            if (newPass.length < 4) {
                alert("Password must be at least 4 characters.");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/change-password`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        old_password: oldPass,
                        new_password: newPass
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    // --- SUCCESS: Redirect Immediately ---
                    localStorage.clear(); // Clear token to force re-login
                    window.location.href = "login.html";
                } else {
                    alert("Error: " + (data.error || "Failed to update password"));
                }
            } catch (err) {
                console.error("Error:", err);
                alert("Network error occurred. Is the server running?");
            }
        });