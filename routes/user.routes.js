const express = require('express');
const { SignUp } = require('../controllers/user.controllers');

const router = express.Router();

router.post('/register', SignUp);

module.exports = router;
