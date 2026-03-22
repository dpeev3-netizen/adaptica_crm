import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server and attach Socket.IO
const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    credentials: true,
  }
});

app.use(cors({
    origin: '*',
  credentials: true,
}));
app.use(express.json());

import activitiesRouter from './routes/activities.routes';
import authRouter from './routes/auth.routes';
import bulkImportRouter from './routes/bulk-import.routes';
import chatRouter from './routes/chat.routes';
import companiesRouter from './routes/companies.routes';
import contactsRouter from './routes/contacts.routes';
import customFieldValuesRouter from './routes/custom-field-values.routes';
import customFieldsRouter from './routes/custom-fields.routes';
import dashboardRouter from './routes/dashboard.routes';
import dealsRouter from './routes/deals.routes';
import exportRouter from './routes/export.routes';
import notificationsRouter from './routes/notifications.routes';
import pipelinesRouter from './routes/pipelines.routes';
import reportsRouter from './routes/reports.routes';
import searchRouter from './routes/search.routes';
import seedRouter from './routes/seed.routes';
import tagsRouter from './routes/tags.routes';
import tasksRouter from './routes/tasks.routes';
import usersRouter from './routes/users.routes';
import webhooksRouter from './routes/webhooks.routes';
import workflowsRouter from './routes/workflows.routes';

app.use('/api/activities', activitiesRouter);
app.use('/api/auth', authRouter);
app.use('/api/bulk-import', bulkImportRouter);
app.use('/api/chat', chatRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/custom-field-values', customFieldValuesRouter);
app.use('/api/custom-fields', customFieldsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/export', exportRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/pipelines', pipelinesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/search', searchRouter);
app.use('/api/seed', seedRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/workflows', workflowsRouter);

import { startWorkers } from './workers';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM Backend running' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  
  // Join a user-specific room for targeted notifications
  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`[Socket.IO] User ${userId} joined room user:${userId}`);
  });

  // Join a workspace room for broadcast events
  socket.on('join_workspace', (workspaceId: string) => {
    socket.join(`workspace:${workspaceId}`);
    console.log(`[Socket.IO] Socket joined workspace:${workspaceId}`);
  });

  // Join a chat channel room
  socket.on('join_channel', (channelId: string) => {
    socket.join(`channel:${channelId}`);
    console.log(`[Socket.IO] Socket joined channel:${channelId}`);
  });

  socket.on('leave_channel', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Use httpServer.listen instead of app.listen for Socket.IO
httpServer.listen(port, () => {
  console.log(`Backend Express server listening on port ${port}`);
  console.log(`[Socket.IO] Real-time server ready on port ${port}`);
  // startWorkers(); // Temporarily disabled to prevent Redis ECONNREFUSED errors
});
