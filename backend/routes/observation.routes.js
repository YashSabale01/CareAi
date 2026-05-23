const router = require('express').Router();
const ctrl = require('../controllers/observation.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/',                   requireRole('caretaker'),              ctrl.create);       // CARETAKER ONLY
router.get('/patient/:patientId',  requireRole('doctor', 'caretaker', 'admin'), ctrl.getByPatient);
router.delete('/:id',              requireRole('caretaker'),              ctrl.remove);       // own only (checked in controller)

module.exports = router;
