
const Comment  = require('../models/comment.model');

//create a comment
exports.createComment = async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(422).json({ error: 'Please add all the fields' });
  }
  req.user.password = undefined;
  const comment = new Comment({
    text,
    postedBy: req.user.id,
    postId: req.params.id,
  });
  try {
    const result = await comment.save();
    res.json({ comment: result });
  } catch (err) {
    console.log(err);
  }
};

//get all comments
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .populate('postedBy', '_id name')
      .sort('-createdAt');
    res.json({ comments });
  } catch (err) {
    console.log(err);
  }
};

//get a comment
exports.getComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('postedBy', '_id name');
    res.json({ comment });
  } catch (err) {
    console.log(err);
  }
};

//update a comment
exports.updateComment = async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(422).json({ error: 'Please add all the fields' });
  }
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          text,
        },
      },
      {
        new: true,
      }
    );
    res.json({ comment });
  } catch (err) {
    console.log(err);
  }
};

//delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.log(err);
  }
};

//like a comment
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        $push: { likes: req.user.id },
      },
      {
        new: true,
      }
    );
    res.json({ comment });
  } catch (err) {
    console.log(err);
  }
};

//unlike a comment
exports.unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { likes: req.user.id },
      },
      {
        new: true,
      }
    );
    res.json({ comment });
  } catch (err) {
    console.log(err);
  }
};

