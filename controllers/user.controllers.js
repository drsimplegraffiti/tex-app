const User = require('../models/user.model');
const logger = require('../logs/logger');
const cloudinary = require('../utils/cloudinary');
const sharp = require('sharp');
const { comparePassword } = require('../helper/hash');

exports.SignUp = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    // validate
    if (!(username && password && email)) {
      return res.status(400).json({ message: 'All input is required' });
    }
    const checkExistingUser = await User.findOne({ email });
    if (checkExistingUser) {
      return res.status(400).json({ message: 'User already exists.' }); // this condition needs to be stopped if error is thrown
    }

    //

    // create a new user
    const user = await User.create({ username, password, email });
    await user.generateAuthToken();
    return res.status(201).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// user login
exports.Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // validate
    if (!(email && password)) {
      return res.status(400).json({ message: 'All input is required' });
    }
    const user = await User.findOne({ email });
    if (user && comparePassword(password)) {
      await user.generateAuthToken();
      return res.status(200).json({ user });
    }
    return res.status(400).json({ message: 'Invalid credentials' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// upload user profile image using multer cloudinary
exports.UploadImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'user',
      width: 150,
      crop: 'scale',
    });

    // resize image using sharp use path.join()
   const resizedImage = await sharp(req.file.path)
      .resize(150, 150)
      .toFile(`./public/images/${req.file.filename}.png`);
    

    // save image to user model
    user.image = result.secure_url;

    await user.save();
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};
