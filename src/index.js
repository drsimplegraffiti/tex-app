require('dotenv').config();
const express = require('express');

const cors = require('cors');
const connectDB = require('./db/db');
const userRoutes = require('./routes/user.routes');
const logger = require('./logs/logger');
const port = process.env.PORT || 7890;

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api', userRoutes);

// 404 error
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// global error
app.use((error, req, res, next) => {
  console.log('I am coming from here');
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
