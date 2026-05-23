const router = require('express').Router();
const ctrl = require('../controllers/alert.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/',                    requireRole('doctor', 'admin'),          ctrl.getAll);
router.get('/patient/:patientId',  requireRole('doctor', 'caretaker', 'admin'), ctrl.getByPatient);
router.put('/:id/acknowledge',     requireRole('doctor'),                   ctrl.acknowledge);  // DOCTOR ONLY
router.put('/:id/resolve',         requireRole('doctor'),                   ctrl.resolve);      // DOCTOR ONLY

module.exports = router;
