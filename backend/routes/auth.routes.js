const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', verifyToken, ctrl.getMe);
router.put('/change-password', verifyToken, ctrl.changePassword);
router.post('/logout', verifyToken, ctrl.logout);

module.exports = router;
