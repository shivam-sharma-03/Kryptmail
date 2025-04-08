document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert("Login failed: " + data.error);
        } else {
            localStorage.setItem("emailCipherUser", email);
            localStorage.setItem("isLoggedIn", "true"); // ✅ ADD THIS
            alert("Login successful!");
            window.location.href = "main.html";
        }
    } catch (err) {
        alert("Something went wrong.");
        console.error(err);
    }
});
