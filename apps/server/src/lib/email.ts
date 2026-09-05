import { Resend } from "resend";
import { env } from "@DealFlow360/env/server";

const resend = new Resend(env.RESEND_API_KEY);

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
  from?: string;
  replyTo?: string;
};

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, react, from, replyTo } = options;
  const fromAddress = from || env.RESEND_FROM_EMAIL;

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    react,
    replyTo,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { success: true, data };
}

export function getResendClient() {
  return resend;
}

export { resend };
