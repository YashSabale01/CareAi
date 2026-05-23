const router = require('express').Router();
const ctrl = require('../controllers/chatbot.controller');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.post('/message', ctrl.message);

module.exports = router;
