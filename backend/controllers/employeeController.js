const employeeService = require('../services/employeeService');

exports.getAllEmployees = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const users = await employeeService.getAllEmployees();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'EMPLOYEE_LIST_ERROR' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const user = await employeeService.getEmployeeProfile(Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'EMPLOYEE_PROFILE_ERROR' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const updated = await employeeService.updateEmployeeProfile(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'UPDATE_ERROR' });
  }
};