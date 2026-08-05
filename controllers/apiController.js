const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "akeetek01@gmail.com",
        pass: "ezdbjjeavwavxsai"
    }
});

exports.dashboard = (req, res) => {
    res.json({ message: "Excel Protected API" });
};

const db = require("../firebase");
const { ref, set, get, child, update } = require("firebase/database");

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
        await set(ref(db, `employees/${userId}`), { name, email, password, phone });
        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: "Error registering user" });
    }
};

exports.getUsers = async (req, res) => {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'employees'));
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.json({});
        }
    } catch (err) {
        res.status(500).json({ error: "Error fetching employees" });
    }
};

exports.getUsersByEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'employees'));
        if (snapshot.exists()) {
            let user = null;
            snapshot.forEach(childSnap => {
                const userData = childSnap.val();
                if (userData.Email === email) {
                    user = userData;
                }
            });
            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ error: "User not found" });
            }
        } else {
            res.status(404).json({ error: "Users not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Error fetching user" });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'employees'));
        if (snapshot.exists()) {
            let found = false;
            let currentUser = null;
            snapshot.forEach(childSnap => {
                const user = childSnap.val();
                if (user.Email === email && user.Password === password) {
                    found = true;
                    currentUser = user;
                }
            });
            if (found) {
                return res.json({ message: "Login successful", user: currentUser });
            }
        }
        res.status(401).json({ error: "Invalid credentials" });
    } catch (err) {
        res.status(500).json({ error: "Error logging in" });
    }
};


exports.changePassword = async (req, res) => {
    
    const { email, oldPassword, newPassword, isTemp } = req.body;
    console.log("Request Body:", req.body);

    if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({
            error: "Email, old/temp password and new password are required"
        });
    }

    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, "employees"));

        if (!snapshot.exists()) {
            return res.status(404).json({
                error: "Users not found"
            });
        }

        let userKey = null;

        snapshot.forEach((childSnap) => {
            const user = childSnap.val();
            if (isTemp === "true") {
                if (
                    user.Email === email &&
                    user.tempPassword === oldPassword
                ) {
                    userKey = childSnap.key;
                }
            } else {
                if (
                    user.Email === email &&
                    user.Password === oldPassword
                ) {
                    userKey = childSnap.key;
                }
            }
        });

        if (!userKey) {
            return res.status(401).json({
                error: "Invalid email or old/temp password"
            });
        }

        await update(ref(db, `employees/${userKey}`), {
            Password: newPassword,
            isAccountActive: true,
            modifiedDate: new Date().toISOString(),
            tempPassword: null
        });

        return res.status(200).json({
            message: "Password updated successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Failed to update password"
        });
    }
};

exports.insertScript = async (req, res) => {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'InsertScript'));
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.json({});
        }
    } catch (err) {
        res.status(500).json({ error: "Error fetching InsertScript" });
    }
};

exports.updateUser = async (req, res) => {  
      const { email, isAccountActive, tempPassword } = req.body;
      if (!email) {
        return res.status(400).json({
            error: "Email is required"
        });
    }

    try {

        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, "employees"));

        if (!snapshot.exists()) {
            return res.status(404).json({
                error: "Users not found"
            });
        }

        let userKey = null;

        snapshot.forEach((childSnap) => {

            const user = childSnap.val();

            if (user.Email === email) {
                userKey = childSnap.key;
            }

        });

        if (!userKey) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        await update(ref(db, `employees/${userKey}`), {
            modifiedDate: new Date().toISOString(),
            isAccountActive: isAccountActive,
            tempPassword: tempPassword
        });

        return res.json({
            success: true,
            message: "User updated successfully."
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message
        });

    }
}







exports.sendEmail = async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            error: "Name, Email and Password are required."
        });
    }

    const html = `
    <!DOCTYPE html>
    <html>

    <head>
        <style>
            body {
                font-family: Arial;
                background: #f4f4f4;
                padding: 20px;
            }

            .container {
                max-width: 600px;
                margin: auto;
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 0 8px rgba(0,0,0,.15);
            }

            .header {
                background: #0d6efd;
                color: white;
                padding: 20px;
                text-align: center;
            }

            .content {
                padding: 30px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }

            td {
                border: 1px solid #ddd;
                padding: 10px;
            }

            .btn {
                display: inline-block;
                background: #0d6efd;
                color: white !important;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 5px;
            }

            .footer {
                text-align: center;
                color: gray;
                padding: 20px;
            }
        </style>
    </head>

    <body>

        <div class="container">

            <div class="header">
                <h2>Welcome</h2>
            </div>

            <div class="content">

                <p>Hello <b>${name}</b>,</p>

                <p>Your account has been created successfully.</p>

                <table>

                    <tr>
                        <td><b>Email</b></td>
                        <td>${email}</td>
                    </tr>

                    <tr>
                        <td><b>Password</b></td>
                        <td>${password}</td>
                    </tr>

                </table>

                <p>
                    <a class="btn"
                       href="http://localhost:3000/forgotPassword?email=${encodeURIComponent(email)}&tempPw=${encodeURIComponent(password)}&isTemp=true">
                       Change Password
                    </a>
                </p>

                <p>Please change your password after your first login.</p>

            </div>

            <div class="footer">
                © 2026 Excel. All rights reserved.
            </div>

        </div>

    </body>

    </html>
    `;

    try {

        await transporter.sendMail({
            from: '"Support Team" <akeetek01@gmail.com>',
            to: email,
            subject: "Welcome to Excel",
            html: html
        });

        res.json({
            success: true,
            message: `Temporary password sent to the user's ${email} successfully. Please reset your password using the temporary password.`
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

};