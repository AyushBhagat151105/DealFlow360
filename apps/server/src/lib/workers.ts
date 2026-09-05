import { Worker, type Job } from "bullmq";
import { connection, type EmailJobData, type NotificationJobData } from "./queue.js";
import { connection, type EmailJobData, type NotificationJobData } from "./queue";
import { sendEmail } from "./email";

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { to } = job.data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { sent: true, to, timestamp: new Date().toISOString() };
    const { to, subject, body } = job.data;
    const result = await sendEmail({
      to,
      subject,
      text: body,
      idempotencyKey: `queue-job/${job.id}`,
    });
    return { sent: result.success, to, timestamp: new Date().toISOString(), error: result.error };
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000,
    },
  }
);

export const notificationWorker = new Worker<NotificationJobData>(
  "notification",
  async (job: Job<NotificationJobData>) => {
    const { userId, type } = job.data;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { sent: true, type, userId, timestamp: new Date().toISOString() };
  },
  {
    connection,
    concurrency: 10,
  }
);

export async function closeWorkers() {
  await emailWorker.close();
  await notificationWorker.close();
}

export function startWorkers() {
  emailWorker.resume();
  notificationWorker.resume();
}
