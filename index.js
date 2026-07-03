const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is working");
});

mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log("MongoDB Connection Error:", err);
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,              // Faculty/Admin Login ID (e.g. FAC001)
    registerNumber: String,     // Student Login ID
    password: String,
    role: String,
    dob: Date
});

const User = mongoose.model("User", UserSchema);


// ================= REGISTER =================

app.post("/register", async (req, res) => {
    try {
        const { name, email, password, role,dob } = req.body;

        if (!name || !email || !password || !role || !dob ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({
            email: email.trim()
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const user = new User({
            name: name.trim(),
            email: email.trim(),
            password: password.trim(),
            role: role.trim(),
            dob: new Date(dob.trim())
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "User Registered Successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Registration Failed"
        });

    }
});


// ================= ADD STUDENT =================

app.post("/add-student", async (req, res) => {

    try {

        const { name, registerNumber, password } = req.body;

        if (!name || !registerNumber || !password) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }

        const existingStudent = await User.findOne({
            registerNumber: registerNumber.trim()
        });

        if (existingStudent) {

            return res.status(400).json({
                success: false,
                message: "Register Number already exists"
            });

        }

        const student = new User({

            name: name.trim(),
            registerNumber: registerNumber.trim(),
            password: password.trim(),
            role: "student"

        });

        await student.save();

        res.status(201).json({

            success: true,
            message: "Student Added Successfully"

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,
            message: "Failed to Add Student"

        });

    }

});


// ================= LOGIN =================

app.post("/login", async (req, res) => {

    try {

        console.log("Login Request:");
        console.log(req.body);

        const loginId = req.body.email?.trim();
        const password = req.body.password?.trim();

        if (!loginId || !password) {

            return res.status(400).json({

                success: false,
                message: "Login ID and Password are required"

            });

        }

        const user = await User.findOne({

            password,

            $or: [
                { email: loginId },              // Faculty/Admin
                { registerNumber: loginId }      // Student
            ]

        });

        console.log("Found User:", user);

        if (!user) {

            return res.status(401).json({

                success: false,
                message: "Invalid Login ID or Password"

            });

        }

        res.status(200).json({

            success: true,
            message: "Login Successful",

            user: {

                id: user._id,
                name: user.name,
                role: user.role,

                loginId:
                    user.role === "student"
                        ? user.registerNumber
                        : user.email

            }

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,
            message: "Internal Server Error"

        });

    }

});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});