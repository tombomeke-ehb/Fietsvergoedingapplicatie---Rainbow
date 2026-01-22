// backend/index.js
require('dotenv').config();

const express = require("express");
const cors = require("cors");

const authMiddleware = require("./middleware/auth");

const demoRoutes = require("./routes/demoRoutes");
const tripRoutes = require("./routes/tripRoutes");
const exportRoutes = require("./routes/exportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const exportMonthRoutes = require('./routes/exportMonthRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

console.log("DEMO_MODE =", process.env.DEMO_MODE);


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: false,
    // In PoC gebruiken we een custom header om de demo-user door te geven.
    allowedHeaders: ["Content-Type", "x-demo-user-id"],
  })
);

app.use(express.json());

// Simple health check
app.get("/", (req, res) => res.send("Fietsvergoeding Backend API"));

// Demo routes: bewust zonder auth middleware (auth zit op x-demo-user-id)
app.use("/demo", demoRoutes);

// Alles onder deze lijn vereist een geldige demo user header
app.use(authMiddleware);

// Kern routes (zoals in je analyse)
app.use("/trip-entries", tripRoutes);
app.use("/exports", exportRoutes);
app.use('/exports', exportMonthRoutes);
app.use("/settings", settingsRoutes);
app.use("/employees", employeeRoutes);
app.use("/admin", adminRoutes);

// Handig endpoint voor de frontend om “wie ben ik?” te tonen
app.get("/me", (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    role: req.user.role,
    country: req.user.country,
    bikeType: req.user.bikeType,
    profile: req.user.profile,
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});