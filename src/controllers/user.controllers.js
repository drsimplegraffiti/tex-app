const User = require('../models/user.model');
const logger = require('../logs/logger');

exports.SignUp = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    // validate
    if (!(username && password && email)) {
      return res.status(400).json({ message: 'All input is required' });
    }
    const checkExistingUser = await User.findOne({ email });
    if (checkExistingUser) {
      return res.status(400).json({ message: 'User already exists' }); // this condition needs to be stopped if error is thrown
    }

    // create a new user
    const user = await User.create({ username, password, email });
    await user.generateAuthToken();
    return res.status(201).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};
