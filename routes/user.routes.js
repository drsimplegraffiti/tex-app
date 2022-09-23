const express = require('express');
const { SignUp, Login } = require('../controllers/user.controllers');

const router = express.Router();

router.post('/register', SignUp);

router.post('/login', Login);

module.exports = router;
