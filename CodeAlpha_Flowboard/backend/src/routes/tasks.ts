import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { getProjectOrFail } from '../lib/access.js';
import { createNotification, emitToProject } from '../socket/index.js';

const router = Router();
router.use(authMiddleware);

const createColumnSchema = z.object({
  title: z.string().min(1),
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  columnId: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

router.post('/projects/:projectId/columns', async (req, res) => {
  const project = await getProjectOrFail(req.params.projectId, req.user!.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const parsed = createColumnSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const maxPos = await prisma.column.aggregate({
    where: { projectId: project.id },
    _max: { position: true },
  });

  const column = await prisma.column.create({
    data: {
      title: parsed.data.title,
      projectId: project.id,
      position: (maxPos._max.position ?? -1) + 1,
    },
    include: { tasks: true },
  });

  emitToProject(project.id, 'column:created', column);
  res.status(201).json(column);
});

router.post('/columns/:columnId/tasks', async (req, res) => {
  const column = await prisma.column.findUnique({
    where: { id: req.params.columnId },
    include: { project: { include: { members: true } } },
  });
  if (!column) return res.status(404).json({ error: 'Column not found' });

  const isMember = column.project.members.some((m) => m.userId === req.user!.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const maxPos = await prisma.task.aggregate({
    where: { columnId: column.id },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      assigneeId: parsed.data.assigneeId,
      priority: parsed.data.priority ?? 'medium',
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      columnId: column.id,
      position: (maxPos._max.position ?? -1) + 1,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } },
    },
  });

  if (task.assigneeId && task.assigneeId !== req.user!.id) {
    await createNotification(
      task.assigneeId,
      'task_assigned',
      `${req.user!.name} assigned you "${task.title}"`,
      `/projects/${column.projectId}?task=${task.id}`
    );
  }

  emitToProject(column.projectId, 'task:created', task);
  res.status(201).json(task);
});

router.get('/tasks/:taskId', async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      column: { include: { project: { include: { members: true } } } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!task) return res.status(404).json({ error: 'Task not found' });
  const isMember = task.column.project.members.some((m) => m.userId === req.user!.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  res.json(task);
});

router.patch('/tasks/:taskId', async (req, res) => {
  const existing = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: { column: { include: { project: { include: { members: true } } } } },
  });
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const isMember = existing.column.project.members.some((m) => m.userId === req.user!.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { dueDate, ...rest } = parsed.data;
  const task = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...rest,
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } },
    },
  });

  if (
    parsed.data.assigneeId &&
    parsed.data.assigneeId !== existing.assigneeId &&
    parsed.data.assigneeId !== req.user!.id
  ) {
    await createNotification(
      parsed.data.assigneeId,
      'task_assigned',
      `${req.user!.name} assigned you "${task.title}"`,
      `/projects/${existing.column.projectId}?task=${task.id}`
    );
  }

  emitToProject(existing.column.projectId, 'task:updated', task);
  res.json(task);
});

router.delete('/tasks/:taskId', async (req, res) => {
  const existing = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: { column: { include: { project: { include: { members: true } } } } },
  });
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const isMember = existing.column.project.members.some((m) => m.userId === req.user!.id);
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  await prisma.task.delete({ where: { id: req.params.taskId } });
  emitToProject(existing.column.projectId, 'task:deleted', { id: req.params.taskId });
  res.status(204).send();
});

export default router;
