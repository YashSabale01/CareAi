const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true, maxlength: 100 },
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:          { type: String, required: true, minlength: 8, select: false },
  role:              { type: String, enum: ['doctor', 'patient', 'caretaker', 'admin'], required: true },
  phone:             { type: String, trim: true },
  isActive:          { type: Boolean, default: true },
  // Doctors: patients assigned to them
  assignedPatients:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  // Caretakers: patients they monitor
  monitoredPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
