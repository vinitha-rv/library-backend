const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');  
const router = express.Router();


router.post('/register', registerUser);
router.post('/login', loginUser);

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});
module.exports = router;

