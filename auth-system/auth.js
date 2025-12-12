const API_BASE = "https://knox-swainish-wonderingly.ngrok-free.dev";

// ---------------------------
// SIMPLE ROUTE HELPERS
// ---------------------------
function go(url) {
    window.location.href = url;
}

function saveValidatedToken(token, username, email) {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("email", email);
}

function getTokenPayload(token) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
}

function isAuthenticated() {
    const token = localStorage.getItem("auth_token");
    if (!token) return false;

    const payload = getTokenPayload(token);
    if (!payload) return false;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
        logout();
        return false;
    }

    return payload.validated === true;
}

function logout() {
    localStorage.clear();
    sessionStorage.clear();
    go("login.html");
}

// ---------------------------
// PAGE LOGIC BASED ON FILE
// ---------------------------
const page = window.location.pathname.split("/").pop();

// ---------------------------
// REGISTER PAGE
// ---------------------------
if (page === "register.html") {
    document.getElementById("registerBtn").onclick = async () => {
        const username = document.getElementById("regUsername").value;
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPassword").value;
        const err = document.getElementById("registerError");

        err.textContent = "";

        try {
            const res = await fetch(`${API_BASE}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert("Account created! Please login.");
            go("login.html");
        } catch (e) {
            err.textContent = e.message;
        }
    };
}

// ---------------------------
// LOGIN PAGE
// ---------------------------
if (page === "login.html") {
    document.getElementById("loginBtn").onclick = async () => {
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;
        const err = document.getElementById("loginError");

        err.textContent = "";

        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            sessionStorage.setItem("temp_token", data.temp_token);
            alert("OTP sent!");

            go("otp.html");
        } catch (e) {
            err.textContent = e.message;
        }
    };
}

// ---------------------------
// OTP PAGE
// ---------------------------
if (page === "otp.html") {
    document.getElementById("verifyOtpBtn").onclick = async () => {
        const otp = document.getElementById("otpInput").value;
        const tempToken = sessionStorage.getItem("temp_token");
        const err = document.getElementById("otpError");

        err.textContent = "";

        try {
            const res = await fetch(`${API_BASE}/api/otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ token: tempToken, otp })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            saveValidatedToken(data.token, data.username, data.email);

            go("http://localhost:1234/");
        } catch (e) {
            err.textContent = e.message;
        }
    };
}

// ---------------------------
// DASHBOARD
// ---------------------------
// if (page === "dashboard.html") {
//     if (!isAuthenticated()) {
//         go("login.html");
//     }

//     document.getElementById("userName").textContent = localStorage.getItem("username");
//     document.getElementById("userEmail").textContent = localStorage.getItem("email");

//     document.getElementById("logoutBtn").onclick = logout;
// }
