// backend/controllers/demoController.js
const userService = require("../services/userService");

function demoModeEnabled() {
  // Ondersteunt DEMO_MODE=true / 1 / yes
  const v = String(process.env.DEMO_MODE || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

exports.demoLogin = async (req, res) => {
  try {
    if (!demoModeEnabled()) {
      return res.status(403).json({ error: "DEMO_MODE_DISABLED" });
    }

    const userId = Number(req.body.userId);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "INVALID_USER_ID" });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    // PoC response: frontend bewaart userId en stuurt die als header mee
    res.json({ success: true, userId: user.id, role: user.role, country: user.country });
  } catch (err) {
    console.error("Demo login error:", err);
    res.status(500).json({ error: "DEMO_LOGIN_ERROR" });
  }
};

exports.demoLogout = (req, res) => {
  // In PoC is er geen echte sessie, dus logout is enkel “frontend state reset”
  res.json({ success: true });
};
