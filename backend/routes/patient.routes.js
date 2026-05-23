// Patient routes — create/update/delete restricted to ADMIN only
const router = require('express').Router();
const ctrl = require('../controllers/patient.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Patient gets their own profile
router.get('/me', requireRole('patient'), async (req, res, next) => {
  try {
    const Patient = require('../models/Patient');
    const patient = await Patient.findOne({ userId: req.user.userId })
      .populate('userId', 'name email phone')
      .populate('assignedDoctorId', 'name email')
      .populate('assignedCaretakerId', 'name email');
    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
    res.json({ patient });
  } catch (err) { next(err); }
});

router.get('/',     requireRole('doctor', 'caretaker', 'admin'), ctrl.getAll);
router.post('/',    requireRole('admin'),                         ctrl.create);
router.get('/:id',  requireRole('doctor', 'caretaker', 'patient', 'admin'), ctrl.getById);
router.put('/:id',  requireRole('admin'),                         ctrl.update);
router.delete('/:id', requireRole('admin'),                       ctrl.remove);

module.exports = router;
