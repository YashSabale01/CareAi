const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.post('/generate', requireRole('doctor', 'admin'), ctrl.generate);
router.get('/patient/:patientId', ctrl.getByPatient);
router.get('/:reportId/download', ctrl.download);

module.exports = router;
