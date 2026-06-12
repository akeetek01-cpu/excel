exports.dashboard = (req, res) => {
    res.json({ message: "Excel Protected API" });
};

const db = require("../firebase");
const { ref, set, get, child } = require("firebase/database");

exports.registerUser = async (req, res) => {
     //res.json({ message: "Excel Protected API" });
        console.log(`${req.method} ${req.url}`);

    const { name, email, password, phone } = req.body;
    console.log("Received registration data:", { name, email, password: password ? "****" : undefined, phone: phone ? "****" : undefined });
    if (!name || !email || !password || !phone) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const userId = Date.now();
    try {
        await set(ref(db, `users/${userId}`), { name, email, password, phone });
        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: "Error registering user" });
    }
};

exports.getUsers = async (req, res) => {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'users'));
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.json({});
        }
    } catch (err) {
        res.status(500).json({ error: "Error fetching users" });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'users'));
        if (snapshot.exists()) {
            let found = false;
            snapshot.forEach(childSnap => {
                const user = childSnap.val();
                if (user.email === email && user.password === password) {
                    found = true;
                }
            });
            if (found) {
                return res.json({ message: "Login successful" });
            }
        }
        res.status(401).json({ error: "Invalid credentials" });
    } catch (err) {
        res.status(500).json({ error: "Error logging in" });
    }
};