const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(
  process.env.MONGO_URI
)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// User Model
const UserSchema = new mongoose.Schema({
  name: String,
  dob: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", UserSchema);

// Register
app.post("/register", async (req, res) => {
    try {
        const user = await User.create(req.body);
        const token = jwt.sign({ id: user._id }, "secretKey");
        res.json({ 
            status: "ok", 
            token, 
            user: {
                name: user.name,
                dob: user.dob,
                email: user.email
            }
        });
    } catch (err) {
        res.json({ status: "error", error: err });
    }
});

// Login
app.post("/login", async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.json({ status: "error", error: "User not found" });
    }

    if (req.body.password !== user.password) {
        return res.json({ status: "error", error: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, "secretKey");
    
    res.json({
        status: "ok",
        token,
        user: {
            name: user.name,
            dob: user.dob,
            email: user.email
        }
    });
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"];
  
  if (!token) {
    return res.json({ status: "error", error: "No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, "secretKey");
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.json({ status: "error", error: "Invalid token" });
  }
};

// Get all users (protected route)
app.get("/users", verifyToken, async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ status: "ok", users });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

app.listen(5000, () =>
  console.log("Server running on http://localhost:5000")
);