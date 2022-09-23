// hash password
const bcrypt = require('bcrypt');

exports.comparePassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const isMatch = await bcrypt.compare(password, salt);
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing password');
  }
};
