const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = 3000;

// ===== Middleware =====
app.use(express.json());
app.use(cors());
app.use(helmet());

// ===== MongoDB Connection =====
const MONGO_URI = "mongodb+srv://user_name:password@cluster0.64dbfpj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ===== Schema =====
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    passwordHash: String,
    publicKey: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// ===== Routes =====

// Signup
app.post("/api/signup", async (req, res) => {
    const { email, password, publicKey } = req.body;

    if (!email || !password || !publicKey) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: "Email already exists" });

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ email, passwordHash, publicKey });
        await user.save();
        res.json({ message: "Signup successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "Missing fields" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(401).json({ error: "Invalid credentials" });

        // Simple response, no JWT yet
        res.json({ message: "Login successful" });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get Public Key by Email
app.get("/api/public-key", async (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing email" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ publicKey: user.publicKey });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/api/deleteUser", async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
  
    const user = await User.findOneAndDelete({ email });
  
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    res.status(200).json({ message: "User deleted successfully" });
  });

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
