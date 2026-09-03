import { prisma } from "./prisma";

export async function notifyUser(options: {
  userId: string;
  senderId?: string | null;
  applicationId?: string | null;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "ANNOUNCEMENT";
  category?: "APPLICATION" | "DOCUMENT" | "SCREENING" | "DECISION" | "ANNOUNCEMENT" | "REQUEST";
}) {
  return prisma.notification.create({
    data: {
      userId: options.userId,
      senderId: options.senderId ?? null,
      applicationId: options.applicationId ?? null,
      title: options.title,
      message: options.message,
      type: options.type ?? "INFO",
      category: options.category ?? "APPLICATION",
    },
  });
}

export async function notifyMany(
  userIds: string[],
  options: Omit<Parameters<typeof notifyUser>[0], "userId">,
) {
  if (!userIds.length) return { count: 0 };
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      senderId: options.senderId ?? null,
      applicationId: options.applicationId ?? null,
      title: options.title,
      message: options.message,
      type: options.type ?? "INFO",
      category: options.category ?? "ANNOUNCEMENT",
    })),
  });
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
