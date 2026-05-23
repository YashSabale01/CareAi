const router = require('express').Router();
const ctrl = require('../controllers/vitals.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// CARETAKER ONLY submits vitals
router.post('/submit', requireRole('caretaker'), ctrl.submitVitals);

router.get('/patient/:patientId', requireRole('doctor', 'caretaker', 'patient', 'admin'), ctrl.getByPatient);
router.get('/:id',                requireRole('doctor', 'caretaker', 'patient', 'admin'), ctrl.getById);

module.exports = router;
