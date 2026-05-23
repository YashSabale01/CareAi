// All admin routes — ADMIN ONLY
const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/users',              ctrl.listUsers);
router.post('/users',             ctrl.createUser);
router.put('/users/:id',          ctrl.updateUser);
router.delete('/users/:id',       ctrl.deactivateUser);
router.post('/assign/doctor',     ctrl.assignDoctor);
router.post('/assign/caretaker',  ctrl.assignCaretaker);

module.exports = router;
