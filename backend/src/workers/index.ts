import { Worker, Job } from "bullmq";
import Redis from "ioredis";

export const startWorkers = () => {
  console.log("[Worker] 🚀 Initializing Background Automations Worker...");

  const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  }) as any;

  const automationsWorker = new Worker(
    "default-queue",
    async (job: Job) => {
      switch (job.name) {
        case "SEND_EMAIL":
          await handleSendEmail(job.data);
          break;
        case "WEBHOOK_ACTION":
          await handleWebhookAction(job.data);
          break;
        case "WORKSPACE_WEBHOOK":
          await handleWorkspaceWebhook(job.data);
          break;
        default:
          console.warn(`[Worker] Unknown job name: ${job.name}`);
      }
      return { success: true };
    },
    { connection: redisConnection }
  );

  automationsWorker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} (${job.name}) has completed successfully.`);
  });

  automationsWorker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} (${job?.name}) failed with error:`, err);
  });
};

async function handleSendEmail(data: { to: string; subject: string; event: any }) {
  console.log(`[Worker] 📧 Mock SEND_EMAIL to: ${data.to} | Subject: "${data.subject}"`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`[Worker] ✨ Email sent to ${data.to}`);
}

async function handleWebhookAction(data: { url: string; event: string; entityId: string; data: any }) {
  console.log(`[Worker] 🌐 Executing WEBHOOK_ACTION to ${data.url} for event ${data.event}`);
  
  const payload = {
    event: data.event,
    entityId: data.entityId,
    data: data.data,
    timestamp: new Date().toISOString(),
  };

  const res = await fetch(data.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Execution returned status ${res.status}`);
}

async function handleWorkspaceWebhook(data: { webhookId: string; url: string; secret: string | null; payload: any }) {
  console.log(`[Worker] 🌐 Firing WORKSPACE_WEBHOOK to ${data.url}`);
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (data.secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(data.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(JSON.stringify(data.payload)));
    const signature = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    headers["X-Webhook-Signature"] = signature;
  }

  const res = await fetch(data.url, {
    method: "POST",
    headers,
    body: JSON.stringify(data.payload),
  });

  if (!res.ok) throw new Error(`Execution returned status ${res.status}`);
}
