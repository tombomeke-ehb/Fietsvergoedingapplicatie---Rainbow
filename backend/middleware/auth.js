// backend/middleware/auth.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    // demo routes vrij laten
    if (req.path.startsWith("/demo")) return next();

    const raw = req.header("x-demo-user-id");
    if (!raw) return res.status(401).json({ error: "NO_DEMO_USER" });

    const userId = Number(raw);
    if (!Number.isInteger(userId)) return res.status(400).json({ error: "INVALID_USER_ID" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) return res.status(401).json({ error: "UNKNOWN_USER" });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AUTH_ERROR" });
  }
};
