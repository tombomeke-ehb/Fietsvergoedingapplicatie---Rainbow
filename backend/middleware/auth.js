// backend/middleware/auth.js
const userService = require("../services/userService");

module.exports = async (req, res, next) => {
  try {
    // Demo endpoints zijn publiek bereikbaar
    if (req.path.startsWith("/demo")) return next();

    const raw = req.header("x-demo-user-id");
    if (!raw) return res.status(401).json({ error: "NO_DEMO_USER" });

    const userId = Number(raw);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "INVALID_DEMO_USER_ID" });
    }

    // userService.getUserById include profile
    const user = await userService.getUserById(userId);
    if (!user) return res.status(401).json({ error: "UNKNOWN_USER" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "AUTH_ERROR" });
  }
};
