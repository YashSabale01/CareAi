const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/overview',              requireRole('admin'),                                        ctrl.overview);
router.get('/risk-distribution',     requireRole('admin', 'doctor'),                              ctrl.riskDistribution);
router.get('/disease-trends',        requireRole('admin', 'doctor'),                              ctrl.diseaseTrends);
router.get('/alert-stats',           requireRole('admin', 'doctor'),                              ctrl.alertStats);
router.get('/doctor/:doctorId',      requireRole('doctor', 'admin'),                              ctrl.getDoctorAnalytics);
router.get('/caretaker/:caretakerId',requireRole('caretaker', 'admin'),                          ctrl.getCaretakerAnalytics);
router.get('/recovery/:patientId',   requireRole('doctor', 'caretaker', 'patient', 'admin'),     ctrl.getRecoveryProgress);
router.get('/patient/:patientId',    requireRole('doctor', 'caretaker', 'patient', 'admin'),     ctrl.patientAnalytics);

module.exports = router;
