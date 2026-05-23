require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
});
global.io = io;

connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use('/api/', rateLimiter);

// Swagger docs
try {
  const YAML = require('yamljs');
  const swaggerUi = require('swagger-ui-express');
  const swaggerDoc = YAML.load(path.join(__dirname, './swagger/swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch (e) { logger.warn('Swagger doc not loaded: ' + e.message); }

// Routes
app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/patients',     require('./routes/patient.routes'));
app.use('/api/vitals',       require('./routes/vitals.routes'));       // CARETAKER submits
app.use('/api/predictions',  require('./routes/prediction.routes'));   // DOCTOR reads
app.use('/api/alerts',       require('./routes/alert.routes'));         // DOCTOR acknowledges
app.use('/api/careplans',    require('./routes/careplan.routes'));      // DOCTOR manages
app.use('/api/analytics',    require('./routes/analytics.routes'));
app.use('/api/observations', require('./routes/observation.routes'));   // CARETAKER notes
app.use('/api/admin',        require('./routes/admin.routes'));         // ADMIN only
app.use('/api/reports',      require('./routes/report.routes'));
try { app.use('/api/chatbot', require('./routes/chatbot.routes')); } catch (_) {}

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date(), version: '1.0.0', uptime: process.uptime() })
);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('join_room', (userId) => {
    socket.join(userId);
    logger.info(`Socket ${socket.id} joined room: ${userId}`);
  });
  socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`CareAI Backend running on port ${PORT}`));
module.exports = { app, server };
