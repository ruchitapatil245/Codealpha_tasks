import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { createNotification, emitToProject } from '../socket/index.js';

const router = Router();
router.use(authMiddleware);

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'];

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

router.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    where: {
      members: { some: { userId: req.user!.id } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { columns: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(projects);
});

router.post('/', async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { name, description } = parsed.data;
  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId: req.user!.id,
      members: {
        create: { userId: req.user!.id, role: 'owner' },
      },
      columns: {
        create: DEFAULT_COLUMNS.map((title, position) => ({ title, position })),
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      columns: { orderBy: { position: 'asc' } },
    },
  });

  res.status(201).json(project);
});

router.get('/:id', async (req, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      columns: {
        orderBy: { position: 'asc' },
        include: {
          tasks: {
            orderBy: { position: 'asc' },
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              _count: { select: { comments: true } },
            },
          },
        },
      },
    },
  });

  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/:id/members', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.user!.id } },
    },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId } },
  });
  if (existing) return res.status(409).json({ error: 'User already a member' });

  const member = await prisma.projectMember.create({
    data: { projectId: project.id, userId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await createNotification(
    userId,
    'project_invite',
    `${req.user!.name} added you to "${project.name}"`,
    `/projects/${project.id}`
  );

  emitToProject(project.id, 'project:member_added', member);
  res.status(201).json(member);
});

router.delete('/:id/members/:userId', async (req, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user!.id,
    },
  });
  if (!project) return res.status(403).json({ error: 'Only owner can remove members' });

  if (req.params.userId === project.ownerId) {
    return res.status(400).json({ error: 'Cannot remove project owner' });
  }

  await prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId: project.id, userId: req.params.userId },
    },
  });

  emitToProject(project.id, 'project:member_removed', { userId: req.params.userId });
  res.status(204).send();
});

export default router;
