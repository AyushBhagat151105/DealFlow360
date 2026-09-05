import { Queue, type ConnectionOptions } from "bullmq";
import { env } from "@DealFlow360/env/server";

export const connection: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const emailQueue = new Queue("email", { connection });
export const notificationQueue = new Queue("notification", { connection });

export type EmailJobData = {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
};

export type NotificationJobData = {
  userId: string;
  type: "push" | "in-app" | "sms";
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

/**
 * Add an email job to the queue
 */
export async function queueEmail(
  data: EmailJobData,
  options?: { delay?: number; priority?: number },
) {
  return emailQueue.add("send-email", data, {
    delay: options?.delay,
    priority: options?.priority,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
}

/**
 * Add a notification job to the queue
 */
export async function queueNotification(data: NotificationJobData, options?: { delay?: number }) {
  return notificationQueue.add("send-notification", data, {
    delay: options?.delay,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
}

/**
 * Schedule a recurring job (cron-style)
 * @example scheduleRecurringJob(emailQueue, "daily-report", { type: "report" }, "0 9 * * *")
 */
export async function scheduleRecurringJob<T>(
  queue: Queue,
  name: string,
  data: T,
  pattern: string, // Cron pattern
) {
  return queue.upsertJobScheduler(name, { pattern }, { name, data: data as object });
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queue: Queue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Gracefully close all queues and connections
 * Call this during application shutdown
 */
export async function closeQueues() {
  await emailQueue.close();
  await notificationQueue.close();
}
