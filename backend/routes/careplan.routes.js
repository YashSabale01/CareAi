const router = require('express').Router();
const ctrl = require('../controllers/careplan.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/patient/:patientId', requireRole('doctor', 'caretaker', 'patient', 'admin'), ctrl.getPatientCarePlan);
router.put('/:id/approve',        requireRole('doctor'),                                   ctrl.approveCarePlan);   // DOCTOR ONLY
router.put('/:id',                requireRole('doctor'),                                   ctrl.updateCarePlan);    // DOCTOR ONLY
router.get('/:id',                requireRole('doctor', 'caretaker', 'patient', 'admin'), ctrl.getById);

module.exports = router;
