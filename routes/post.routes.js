const express = require('express');
const router = express.Router();

const { createPost, getPosts, getPost, updatePost, deletePost, likePost, unlikePost, commentPost, uncommentPost } = require('../controllers/post.controllers');

const authenticate = require('../middleware/auth');

router.post('/create', authenticate, createPost);
router.get('/all', authenticate, getPosts);
router.get('/:id', authenticate, getPost);
router.put('/update/:id', authenticate, updatePost);
router.delete('/delete/:id', authenticate, deletePost);
router.put('/like', authenticate, likePost);
router.put('/unlike', authenticate, unlikePost);
router.put('/comment', authenticate, commentPost);
router.put('/uncomment', authenticate, uncommentPost);


module.exports = router;