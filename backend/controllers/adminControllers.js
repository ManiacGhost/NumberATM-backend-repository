const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');

dotenv.config();
const resetPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Validate the new password
    if (!newPassword) {
        return res.status(400).json({ message: "New password is required." });
    }

    try {
        // Find the admin based on the decoded token (e.g., using their username or id)
        const admin = await Admin.findOne({username:req.user});

        if (!admin) {
            return res.status(404).json({ message: "Admin not found." });
        }
        if (oldPassword!==admin.password) {
            return res.status(404).json({ message: "Password Not Match." });
        }

        // Update the admin's password in the database (Plain text comparison for now)
        admin.password = newPassword;

        // Save the updated admin information
        await admin.save();

        return res.status(200).json({ message: "Password successfully updated." });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "An error occurred while resetting the password." });
    }
};
const adminLogin = async (req, res) => {
    const { username, password } = req.body;

    // Check if both username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        // Find the admin by username
        const admin = await Admin.findOne({ username });

        if (admin) {
            // Check if the provided password matches the stored password
            if (admin.password === password) {
                // Generate a JWT token with the admin's _id and username
                const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '1y' });

                return res.status(200).json({ message: "Login successful", token, success: true });
            } else {
                return res.status(401).json({ message: "Invalid username or password." });
            }
        } else {
            return res.status(401).json({ message: "Invalid username or password." });
        }
    } catch (err) {
        // Log the error for debugging purposes
        console.error(err);
        return res.status(500).json({ message: "An error occurred while processing the request." });
    }
};


// Controller to check JWT token
const checkAdmin = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.status(200).json({ message: "Token is valid.", user: decoded , success:true});
  } catch (err) {
      res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = { adminLogin, checkAdmin, resetPassword};