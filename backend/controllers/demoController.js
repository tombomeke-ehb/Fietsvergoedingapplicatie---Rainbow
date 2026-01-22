// backend/controllers/demoController.js
const userService = require('../services/userService');

exports.demoLogin = async (req, res) => {
  const userId = Number(req.body.userId);
  
  // Logic verplaatst naar service call
  const user = await userService.getUserById(userId);

  if (!user) {
    return res.status(404).json({ error: 'USER_NOT_FOUND' });
  }

  // PoC response
  res.json({ success: true, userId: user.id, role: user.role, country: user.country });
};

exports.demoLogout = (req, res) => {
  res.json({ success: true });
};