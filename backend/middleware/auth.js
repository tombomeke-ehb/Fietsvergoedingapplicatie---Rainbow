const userService = require('../services/userService');

module.exports = async (req, res, next) => {
  try {
    if (req.path.startsWith("/demo")) return next();

    const raw = req.header("x-demo-user-id");
    if (!raw) return res.status(401).json({ error: "NO_DEMO_USER" });

    const userId = Number(raw);
    const user = await userService.getUserById(userId);

    if (!user) return res.status(401).json({ error: "UNKNOWN_USER" });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AUTH_ERROR" });
  }
};