const express = require('express');
const upload = require('../utils/multer');
const {
  SignUp,
  Login,
  UploadImage,
  SearchUser,
} = require('../controllers/user.controllers');

const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/login', Login);
router.post('/register', SignUp);
router.get('/search', authenticate, SearchUser);

//upload image
router.post('/upload', authenticate, upload.single('image'), UploadImage);

module.exports = router;
