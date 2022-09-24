const Post = require('../models/post.model');

//create a post
exports.createPost = async (req, res) => {
  const { title, body, photo } = req.body;
  if (!title || !body || !photo) {
    return res.status(422).json({ error: 'Please add all the fields' });
  }
  req.user.password = undefined;
  const post = new Post({
    title,
    body,
    photo,
    postedBy: req.user.id,
  });
  try {
    const result = await post.save();
    res.json({ post: result });
  } catch (err) {
    console.log(err);
  }
};

//get all posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('postedBy', '_id name')
      .populate('comments.postedBy', '_id name')
      .sort('-createdAt');
    res.json({ posts });
  } catch (err) {
    console.log(err);
  }
};

//get a post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('postedBy', '_id name')
      .populate('comments.postedBy', '_id name');
    res.json({ post });
  } catch (err) {
    console.log(err);
  }
};

//update a post
exports.updatePost = async (req, res) => {
  const { title, body, photo } = req.body;
  if (!title || !body || !photo) {
    return res.status(422).json({ error: 'Please add all the fields' });
  }
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title,
          body,
          photo,
        },
      },
      {
        new: true,
      }
    );
    res.json({ post });
  } catch (err) {
    console.log(err);
  }
};

//delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.log(err);
  }
};

//like a post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { likes: req.user.id },
      },
      {
        new: true,
      }
    );
    res.json({ post });
  } catch (err) {
    console.log(err);
  }
};

//unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $pull: { likes: req.user.id },
      },
      {
        new: true,
      }
    );
    res.json({ post });
  } catch (err) {
    console.log(err);
  }
};


//comment a post
exports.commentPost = async (req, res) => {
  const comment = {
    text: req.body.text,
    postedBy: req.user.id,
  };
  try {
    const post = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { comments: comment },
      },
      {
        new: true,
      }
    )
      .populate('comments.postedBy', '_id name')
      .populate('postedBy', '_id name');
    res.json({ post });
  } catch (err) {
    console.log(err);
  }
};


//uncomment a post
exports.uncommentPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $pull: { comments: { _id: req.body.commentId } },
      },
      {
        new: true,
      }
    )
      .populate('comments.postedBy', '_id name')
      .populate('postedBy', '_id name');
    res.json({ post });
  } catch (err) {
    console.log(err);
  }
};




