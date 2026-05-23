// Predictions are READ-ONLY — created automatically when caretaker submits vitals
const router = require('express').Router();
const ctrl = require('../controllers/prediction.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/patient/:patientId', requireRole('doctor', 'caretaker', 'patient', 'admin'), ctrl.getByPatient);
router.put('/:id/mark-reviewed',  requireRole('doctor'),                                   ctrl.markReviewed);
router.get('/:id',                requireRole('doctor', 'caretaker', 'patient', 'admin'), ctrl.getById);

module.exports = router;
