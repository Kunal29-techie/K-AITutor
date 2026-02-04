// ====================================
// GLOBAL SETTINGS
// ====================================
const API_URL = "https://dvbwohodr9qxd.cloudfront.net";

// ====================================
// AUTH CHECKER
// ====================================
function checkAuth() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    return {
        isAuthenticated: !!token && !!user,
        token,
        user
    };
}

// ====================================
// LOGIN FUNCTION
// ====================================
async function login(email, password) {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    window.location.href = "dashboard.html";
}

// ====================================
// SIGNUP FUNCTION
// ====================================
async function signup(userData) {
    const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Signup failed");
    }

    alert("Signup successful! Please login.");
    window.location.href = "login.html";
}

// ====================================
// LOGOUT FUNCTION
// ====================================
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}
