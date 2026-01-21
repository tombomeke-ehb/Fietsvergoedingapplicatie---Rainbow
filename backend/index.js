// backend/index.js
const express = require('express');
const cors = require('cors');

const authMiddleware = require('./middleware/auth');
const demoRoutes = require('./routes/demoRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: false,
    allowedHeaders: ['Content-Type', 'x-demo-user-id'],
  })
);

app.use(express.json());

// Health
app.get('/', (req, res) => res.send('Fietsvergoeding Backend API'));

// Demo routes (zonder auth verplicht)
app.use('/demo', demoRoutes);

// Auth middleware voor de rest
app.use(authMiddleware);

const tripRoutes = require("./routes/tripRoutes");
const exportRoutes = require("./routes/exportRoutes");
const settingsRoutes = require('./routes/settingsRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

app.use("/trips", tripRoutes);
app.use("/exports", exportRoutes);
app.use('/settings', settingsRoutes);
app.use('/employees', employeeRoutes);

// TODO: hier komen straks echte routes:
app.get('/me', (req, res) => {
  // req.user is gezet door middleware
  res.json({
    id: req.user.id,
    name: req.user.name,
    role: req.user.role,
    country: req.user.country,
    bikeType: req.user.bikeType,
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
