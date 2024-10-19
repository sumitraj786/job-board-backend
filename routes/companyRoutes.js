const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const nodemailer = require('nodemailer');
const router = express.Router();

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register company
router.post('/register', async (req, res) => {
  const { name, email, password, mobile } = req.body;

  try {
    let company = await Company.findOne({ email });
    if (company) {
      return res.status(400).json({ msg: 'Company already exists' });
    }

    company = new Company({ name, email, password: await bcrypt.hash(password, 10), mobile });

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send verification email
    const verificationLink = `http://localhost:5000/api/company/verify/${verificationToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification',
      text: `Click this link to verify your account: ${verificationLink}`,
    };
    await transporter.sendMail(mailOptions);

    await company.save();
    res.json({ msg: 'Company registered. Please verify your email.' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Email verification route
router.get('/verify/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const company = await Company.findOne({ email: decoded.email });
    if (!company) {
      return res.status(400).json({ msg: 'Invalid token' });
    }

    company.isVerified = true;
    await company.save();
    res.json({ msg: 'Email verified successfully' });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, companyId: company._id });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
