const User = require('../models/User');
const { generateToken } = require('../utils/jwt.utils');
const logger = require('../config/logger');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role: role || 'patient', phone });
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });
    logger.info(`New user registered: ${email} (${user.role})`, { module: 'AUTH' });
    res.status(201).json({ token, user });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated' });
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });
    logger.info(`User logged in: ${email}`, { module: 'AUTH' });
    res.json({ token, user });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
};

exports.logout = (_req, res) => res.json({ message: 'Logged out successfully' });
