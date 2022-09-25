const User = require('../models/user.model');
const logger = require('../logs/logger');
const cloudinary = require('../utils/cloudinary');
const sharp = require('sharp');
const fs = require('fs');
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

// user login and toggle remember me using req.session
exports.Login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  try {
    // validate
    if (!(email && password)) {
      return res.status(400).json({ message: 'All input is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // generate token
    const token = await user.generateAuthToken();
    // set cookie
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.expires = false;
    }
    req.session.token = token;
    return res.status(200).json({ user });
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

// search user using regex
exports.SearchUser = async (req, res) => {
  const { username } = req.query;
  try {
    const user = await User.find({
      username: { $regex: username, $options: 'i' },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//forgot password
exports.ForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // validate
    if (!email) {
      return res.status(400).json({ message: 'All input is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    // generate token
    const token = await user.generateAuthToken();
    // send email
    const link = `http://localhost:3000/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Reset Password',
      html: `<p>Click <a href="${link}">here</a> to reset your password</p>`,
    };
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// reset password
exports.ResetPassword = async (req, res) => {
  const { password } = req.body;
  try {
    // validate
    if (!password) {
      return res.status(400).json({ message: 'All input is required' });
    }
    const user = await User.findOne({ token: req.params.token });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    // hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// Login with google
exports.GoogleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const response = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email_verified, name, email } = response.payload;
    if (email_verified) {
      const user = await User.findOne({ email });
      if (user) {
        await user.generateAuthToken();
        return res.status(200).json({ user });
      } else {
        const password = email + process.env.GOOGLE_CLIENT_SECRET;
        const user = await User.create({ username: name, email, password });
        await user.generateAuthToken();
        return res.status(201).json({ user });
      }
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// Login with facebook
exports.FacebookLogin = async (req, res) => {
  try {
    const { userID, accessToken } = req.body;
    const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'GET',
    });
    const data = await response.json();
    const { email, name } = data;
    const user = await User.findOne({ email });
    if (user) {
      await user.generateAuthToken();
      return res.status(200).json({ user });
    } else {
      const password = email + process.env.FACEBOOK_CLIENT_SECRET;
      const user = await User.create({ username: name, email, password });
      await user.generateAuthToken();
      return res.status(201).json({ user });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// search by keyword
exports.SearchByKeyword = async (req, res) => {
  const { keyword } = req.query;
  try {
    const user = await User.find({
      $or: [
        { username: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// See all users registered on the platform weekly
exports.WeeklyUsers = async (req, res) => {
  try {
    const user = await User.find({
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// See all users registered on the platform monthly
exports.MonthlyUsers = async (req, res) => {
  try {
    const user = await User.find({
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// See all users registered on the platform yearly
exports.YearlyUsers = async (req, res) => {
  try {
    const user = await User.find({
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 365)),
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// See all users registered on the platform
exports.AllUsers = async (req, res) => {
  try {
    const user = await User.find();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//user logout
exports.Logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// edit user
exports.EditUser = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['username', 'email', 'password'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// soft delete user
exports.DeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isDeleted = true;
    await user.save();
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// hard delete user
exports.HardDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.remove();
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// get user by id
exports.GetUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//switch user role to admin
exports.SwitchToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.role = 'admin';
    await user.save();
    return res.status(200).json({ message: 'User role changed to admin' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//switch user role to user
exports.SwitchToUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.role = 'user';
    await user.save();
    return res.status(200).json({ message: 'User role changed to user' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//create groups for users
exports.CreateGroup = async (req, res) => {
  try {
    const group = new Group(req.body);
    await group.save();
    return res.status(201).json({ group });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

const { Parser } = require('json2csv');

//get all users and export to csv
exports.ExportUsersCsv = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) {
      return res.status(404).json({ message: 'Users not found' });
    }
    const fields = ['username', 'email', 'role', 'createdAt'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(users);

    // save csv file to server
    fs.writeFile('users.csv', csv, (err) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({ message: err.message });
      }
      return res.status(200).json({ message: 'File saved successfully' });
    });
    // res.setHeader('Content-Type', 'text/csv');
    // res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    // return res.status(200).send(csv);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//get all users and export as json
exports.ExportUsersJson = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) {
      return res.status(404).json({ message: 'Users not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=users.json');

    //save to file
    fs.writeFile('users.json', JSON.stringify(users), (err) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({ message: err.message });
      }
      logger.info('File saved successfully');
    });
    res.status(200).send(users);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};
