const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const id = `u-${Date.now()}`;
    const user = await User.create({ id, email, password, firstName, lastName, role });
    
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email, password } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
