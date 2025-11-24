const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (phone) {
      let userExists = await User.findOne({ phone });
      if (userExists) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
    }else if(email){
      let userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "This email already registered" });
      }
    }

    const newUser = await User.create({ name, phone, password, email });
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        profileCompleted : true
      },
      message: "Account created successfully",
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error", code: error?.errorResponse?.code });
  }
};

// Register User
exports.loginUserByOtp = async (req, res) => {
  try {
    const { phone, type, email } = req.body;
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });
    res.status(201).json({
      token,
      user,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { phone} = req.body;
    let user = null;
    user = await User.findOne({ phone });
    // else user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ phone });
    }
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({ token, user: { _id: user._id, name: user.name, phone: user.phone } });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" });
  }
};

exports.checkLogin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get User By ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update User
// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    console.log(req.body)
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { name, email, profileCompleted: name ? true : false, phone },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
