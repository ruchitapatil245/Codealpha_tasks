import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { createNotification, emitToProject } from '../socket/index.js';

const router = Router();
router.use(authMiddleware);

const commentSchema = z.object({
  content: z.string().min(1),
});

router.get('/tasks/:taskId/comments', async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: { column: { include: { project: { include: { members: true } } } } },
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const isMember = task.column.project.members.some((m) => m.userId === req.user!.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const comments = await prisma.comment.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  res.json(comments);
});

router.post('/tasks/:taskId/comments', async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: {
      assignee: true,
      column: { include: { project: { include: { members: true } } } },
    },
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const isMember = task.column.project.members.some((m) => m.userId === req.user!.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const comment = await prisma.comment.create({
    data: {
      content: parsed.data.content,
      taskId: task.id,
      authorId: req.user!.id,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  const notifyIds = new Set<string>();
  if (task.assigneeId && task.assigneeId !== req.user!.id) {
    notifyIds.add(task.assigneeId);
  }
  for (const m of task.column.project.members) {
    if (m.userId !== req.user!.id) notifyIds.add(m.userId);
  }

  for (const userId of notifyIds) {
    await createNotification(
      userId,
      'comment',
      `${req.user!.name} commented on "${task.title}"`,
      `/projects/${task.column.projectId}?task=${task.id}`
    );
  }

  emitToProject(task.column.projectId, 'comment:created', { taskId: task.id, comment });
  res.status(201).json(comment);
});

router.get('/notifications', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

router.patch('/notifications/:id/read', async (req, res) => {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { read: true },
  });
  if (notification.count === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ success: true });
});

router.patch('/notifications/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

export default router;
