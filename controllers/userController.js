const User = require('../models/User');
const jwt = require('jsonwebtoken'); 


const registerUser = async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
   
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

 
    const user = new User({ name, username, email, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};