const Post = require('../models/post.model');

//create a post with image and upload the image to cloudinary
exports.createPost = async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(422).json({ error: 'Please add all the fields' });
  }
  req.user.password = undefined;

  //upload image to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'insta-clone',
  });

  const post = new Post({
    title,
    body,
    photo: result.secure_url,
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

//control who can see the post
exports.getSubPosts = async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: { $in: req.user.following } })
      .populate('postedBy', '_id name')
      .populate('comments.postedBy', '_id name')
      .sort('-createdAt');
    res.json({ posts });
  } catch (err) {
    console.log(err);
  }
};


// tag people in a post
exports.tagPeople = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { taggedPeople: req.body.taggedPeople },
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

//advanced search
exports.advancedSearch = async (req, res) => {
  try {
    const posts = await Post.find({
      $or: [
        { title: { $regex: req.body.search, $options: 'i' } },
        { body: { $regex: req.body.search, $options: 'i' } },
      ],
    })
      .populate('postedBy', '_id name')
      .populate('comments.postedBy', '_id name')
      .sort('-createdAt');
    res.json({ posts });
  } catch (err) {
    console.log(err);
  }
};


//export posts as a csv file
exports.exportPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('postedBy', '_id name')
      .populate('comments.postedBy', '_id name')
      .sort('-createdAt');
    const fields = ['title', 'body', 'photo', 'postedBy', 'comments'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(posts);
    res.attachment('posts.csv');
    res.status(200).send(csv);
  } catch (err) {
    console.log(err);
  }
};

//export posts as a json file
exports.exportPostsJson = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('postedBy', '_id name')
      .populate('comments.postedBy', '_id name')
      .sort('-createdAt');
    res.attachment('posts.json');
    res.status(200).send(posts);
  } catch (err) {
    console.log(err);
  }
};

//export posts as a pdf file
exports.exportPostsPdf = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('postedBy', '_id name')
      .populate('comments.postedBy', '_id name')
      .sort('-createdAt');
    const doc = new PDFDocument();
    res.attachment('posts.pdf');
    doc.pipe(res);
    doc.text(JSON.stringify(posts));
    doc.end();
  } catch (err) {
    console.log(err);
  }
};