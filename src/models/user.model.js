const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please enter a username'],
      unique: true,
      trim: true,
      minlength: 3,
    },
    token: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      trim: true,
      minlength: 3,
    },

    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      trim: true,
      minlength: 3,
    },

    role: {
      type: String,
      trim: true,
      minlength: 3,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  user.token = token;
  await user.save();
  return token;
};

// Return error if password contains the word pass
userSchema.pre('save', async function (next) {
  try {
    const user = this;
    if (user.password.includes('pass')) {
      throw new Error('Password cannot contain "pass"');
    }
  } catch (error) {
    next(error);
  }
  next();
});

userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt); // "this" refers to the user object
  next();
});

//HIDE DATA
userSchema.methods.toJSON = function () {
  // in db data is as JSON
  const user = this;
  const userObject = user.toObject(); // convert to data coming from db to object
  delete userObject.password;
  delete userObject.__v;
  delete userObject.createdAt;
  delete userObject.updatedAt;
  delete userObject._id;
  return userObject;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
