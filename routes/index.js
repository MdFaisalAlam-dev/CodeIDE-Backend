var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var userModel = require('../models/userModel');
var projectModel = require("../models/projectModel");

const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret';

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Express' });
});

const secret = "secret"; // secret key for jwt

/**
 * POST /signUp
 * Body: { username, name, email, password }
 */
router.post('/signUp', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.json({ success: false, message: 'All fields are required' });
    }

    const existing = await userModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await userModel.create({
      username,
      name,
      email: email.toLowerCase(),
      password: hash,
    });

    return res.json({ success: true, message: 'User created successfully' });
  } catch (err) {
    console.error('SignUp error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.json({ success: false, message: 'Email and password required' });

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: false, message: 'User not found!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { email: user.email, userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'User logged in successfully',
      token: token,
      userId: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

router.post("/getUserDetails", async (req, res) => {
  console.log("Called")
  let { userId } = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    return res.json({ success: true, message: "User details fetched successfully", user: user });
  } else {
    return res.json({ success: false, message: "User not found!" });
  }
});

router.post("/createProject", async (req, res) => {
  let { userId, title } = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    let project = await projectModel.create({
      title: title,
      createdBy: userId
    });


    return res.json({ success: true, message: "Project created successfully", projectId: project._id });
  }
  else {
    return res.json({ success: false, message: "User not found!" });
  }
});

// Get all projects for a user
router.post("/getProjects", async (req, res) => {
  try {
    let { userId } = req.body;
    let user = await userModel.findOne({ _id: userId });

    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    let projects = await projectModel.find({ createdBy: userId });

    return res.json({
      success: true,
      message: "Projects fetched successfully",
      projects: projects
    });
  } catch (err) {
    console.error("getProjects error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


router.post("/deleteProject", async (req, res) => {
  try {
    const { userId, progId } = req.body;

    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    // Delete project
    const project = await projectModel.findByIdAndDelete(progId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found!" });
    }

    return res.json({ success: true, message: "Project deleted successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/getProject", async (req, res) => {
  let {userId,projId} = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    let project = await projectModel.findOne({ _id: projId });
    return res.json({ success: true, message: "Project fetched successfully", project: project });
  }
  else{
    return res.json({ success: false, message: "User not found!" });
  }
});


router.post("/updateProject", async (req, res) => {
  let { userId, htmlCode, cssCode, jsCode, projId } = req.body;
  let user = await userModel.findOne({ _id: userId });

  if (user) {
    let project = await projectModel.findOneAndUpdate(
      { _id: projId },
      { htmlCode: htmlCode, cssCode: cssCode, jsCode: jsCode },
      { new: true } // This option returns the updated document
    );

    if (project) {
      return res.json({ success: true, message: "Project updated successfully" });
    } else {
      return res.json({ success: false, message: "Project not found!" });
    }
  } else {
    return res.json({ success: false, message: "User not found!" });
  }
});


module.exports = router;
