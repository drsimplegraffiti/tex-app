exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(422).json({ error: 'Please add all the fields' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(422).json({ error: 'Invalid email or password' });
    }
    const doMatch = await bcrypt.compare(password, admin.password);
    if (doMatch) {
      const token = jwt.sign({ _id: admin._id }, JWT_SECRET);
      const { _id, name, email } = admin;
      res.json({ token, admin: { _id, name, email } });
    } else {
      return res.status(422).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.log(err);
  }
};




