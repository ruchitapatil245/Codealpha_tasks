import { prisma } from '../lib/prisma.js';

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!member;
}

export async function getProjectOrFail(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project) return null;
  const isMember = project.members.some((m) => m.userId === userId);
  return isMember ? project : null;
}

export async function getTaskProjectId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { column: true },
  });
  return task?.column.projectId ?? null;
}
