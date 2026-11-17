const mongoose = require('mongoose');
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('connected to mongodb'))
  .catch((err) => console.log('could not connect to mongodb'));

const userSchema = new mongoose.Schema({
  first_name: {type: String, required: true},
  last_name: String,
  email: { type: String, required: true },
  age: Number,
  data: {type: Date, default: Date.now },
  admin: { type: Boolean, required: true, default: false },
});

const User = mongoose.model('User', userSchema);

app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      data: null,
      message: 'the user with the given id was not found',
    });
  }
  

  res.json({ data: user, message: 'ok' });
});


const { body, validationResult } = require('express-validator');

app.post('/api/users', [

  body('first_name', 'first name must be a string')
    .isString()
    .withMessage('first name must be a string')
    .notEmpty()
    .withMessage('first name cant be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('first name must be between 2 and 50 characters'),

  body('last_name')
    .optional()   
    .isString()
    .withMessage('last name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('last name must be between 2 and 50 characters'),

  body('email', 'email must be valid')
    .notEmpty()
    .withMessage('email cant be empty')
    .isEmail()
    .withMessage('email format is invalid'),

  body('age')
    .optional()          
    .isInt({ min: 0, max: 120 })
    .withMessage('age must be an integer between 0 and 120'),

  body('admin')
  .optional()
  .isBoolean()
  .withMessage('admin must be a boolean (true/false)')

], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      data: null,
      errors: errors.array(),
      message: 'validation error',
    });
  }

  try {
    const user = new User(req.body);
    const result = await user.save();
    res.status(201).json({ data: result, message: 'ok' });
  } catch (err) {
    res.status(500).json({ data: null, message: 'server error' });
  }
});


app.put(
  '/api/users/:id',
  [
    body('email', 'email must be valid').optional().isEmail(),
    body('first_name', 'first name cant be empty').optional().notEmpty(),
    body('last_name', 'last name cant be empty').optional().notEmpty(),
    body('age', 'age must be a number').optional().isNumeric(),
    body('admin').optional().isBoolean()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        data: null,
        errors: errors.array(),
        message: 'validation...',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ data: null, message: 'not found' });
    }

    const updates = {};
    if (req.body.first_name !== undefined) updates.first_name = req.body.first_name;
    if (req.body.last_name  !== undefined) updates.last_name  = req.body.last_name;
    if (req.body.email      !== undefined) updates.email      = req.body.email;
    if (req.body.age        !== undefined) updates.age        = req.body.age;
    if (req.body.admin      !== undefined) updates.admin      = req.body.admin;

    const result = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates }, 
      { new: true }       
    );

    res.json({ data: result, message: 'ok' });
  }
);

app.delete('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      data: null,
      message: 'the user with the given id was not found',
    });
  }

  const deletedUser = {
    id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    age: user.age,
  };

  await User.deleteOne({ _id: req.params.id });

  res.json({
    data: deletedUser,
    message: 'this user was deleted',
  });
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));