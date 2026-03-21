import { prisma } from "../config/prisma";
import { defaultQueue } from "./queue";

const logger = console;

// Event types that can trigger workflows
export type SystemEvent =
  | { type: "DEAL_CREATED"; workspaceId: string; entityId: string; data: Record<string, any> }
  | { type: "DEAL_STAGE_CHANGED"; workspaceId: string; entityId: string; data: Record<string, any>; previousStageId?: string }
  | { type: "CONTACT_CREATED"; workspaceId: string; entityId: string; data: Record<string, any> }
  | { type: "CONTACT_UPDATED"; workspaceId: string; entityId: string; data: Record<string, any> };

// Map system events to Prisma triggerType enum values
function mapEventToTrigger(eventType: string): { entityType: string; triggerType: string } | null {
  switch (eventType) {
    case "DEAL_CREATED":
      return { entityType: "DEAL", triggerType: "CREATED" };
    case "DEAL_STAGE_CHANGED":
      return { entityType: "DEAL", triggerType: "STAGE_CHANGED" };
    case "CONTACT_CREATED":
      return { entityType: "CONTACT", triggerType: "CREATED" };
    case "CONTACT_UPDATED":
      return { entityType: "CONTACT", triggerType: "UPDATED" };
    default:
      return null;
  }
}

/**
 * Core automations engine. 
 * Call this after any CRM event to evaluate and execute matching workflows.
 */
export async function evaluateWorkflows(event: SystemEvent): Promise<void> {
  const mapping = mapEventToTrigger(event.type);
  if (!mapping) return;

  try {
    const workflows = await prisma.workflow.findMany({
      where: {
        workspaceId: event.workspaceId,
        isActive: true,
        entityType: mapping.entityType as any,
        triggerType: mapping.triggerType as any,
        deletedAt: null,
      },
      include: {
        actions: { orderBy: { order: "asc" } },
      },
    });

    if (workflows.length === 0) return;

    logger.info(`[Automations] ${workflows.length} workflow(s) matched for event ${event.type}`);

    for (const workflow of workflows) {
      // Optional: evaluate trigger conditions
      if (workflow.triggerConditions) {
        const conditionsMet = evaluateConditions(workflow.triggerConditions, event.data);
        if (!conditionsMet) {
          logger.info(`[Automations] Workflow "${workflow.name}" conditions not met, skipping.`);
          continue;
        }
      }

      logger.info(`[Automations] Executing workflow "${workflow.name}" with ${workflow.actions.length} action(s)`);

      for (const action of workflow.actions) {
        try {
          await executeAction(action, event);
        } catch (actionError) {
          logger.error(`[Automations] Action ${action.id} (${action.type}) failed: ${String(actionError)}`);
        }
      }
    }

    // Fire webhooks for this event
    await fireWebhooks(event);
  } catch (error) {
    logger.error(`[Automations] Failed to evaluate workflows: ${String(error)}`);
  }
}

/**
 * Evaluate simple JSON conditions against event data.
 * Supports basic equality checks: { "field": "value" }
 */
function evaluateConditions(conditionsJson: string, data: Record<string, any>): boolean {
  try {
    const conditions = JSON.parse(conditionsJson);
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) return false;
    }
    return true;
  } catch {
    return true; // If conditions can't be parsed, don't block execution
  }
}

/**
 * Execute a single workflow action.
 */
async function executeAction(
  action: { id: string; type: string; configJson: string },
  event: SystemEvent
): Promise<void> {
  const config = JSON.parse(action.configJson);

  switch (action.type) {
    case "CREATE_TASK": {
      // Create an Activity of type TASK linked to the entity
      await prisma.activity.create({
        data: {
          workspaceId: event.workspaceId,
          userId: config.assigneeId || (event.data.userId ?? "system"),
          entityType: event.type.startsWith("DEAL") ? "DEAL" : "CONTACT",
          entityId: event.entityId,
          type: "TASK",
          content: config.title || `Auto-task for ${event.type}`,
          priority: config.priority || "MEDIUM",
          status: "PENDING",
          dueDate: config.dueDays
            ? new Date(Date.now() + config.dueDays * 86400000)
            : null,
        },
      });
      logger.info(`[Automations] Created task for entity ${event.entityId}`);
      break;
    }

    case "UPDATE_FIELD": {
      // Update a field on the entity
      const { field, value } = config;
      if (!field) break;

      const model = event.type.startsWith("DEAL") ? "deal" : "contact";
      await (prisma as any)[model].update({
        where: { id: event.entityId },
        data: { [field]: value },
      });
      logger.info(`[Automations] Updated ${model}.${field} for ${event.entityId}`);
      break;
    }

    case "SEND_EMAIL": {
      await defaultQueue.add("SEND_EMAIL", {
        to: config.to || "entity",
        subject: config.subject,
        event,
      });
      logger.info(`[Automations] Enqueued EMAIL action to ${config.to || "entity"}`);
      break;
    }

    case "WEBHOOK": {
      if (config.url) {
        await defaultQueue.add("WEBHOOK_ACTION", {
          url: config.url,
          event: event.type,
          entityId: event.entityId,
          data: event.data,
        });
        logger.info(`[Automations] Enqueued Webhook action to ${config.url}`);
      }
      break;
    }

    default:
      logger.warn(`[Automations] Unknown action type: ${action.type}`);
  }
}

/**
 * Fire all registered workspace webhooks that subscribe to this event type.
 */
async function fireWebhooks(event: SystemEvent): Promise<void> {
  try {
    const webhooks = await (prisma as any).webhook.findMany({
      where: {
        workspaceId: event.workspaceId,
        isActive: true,
      },
    });

    for (const webhook of webhooks) {
      const subscribedEvents = webhook.events as string[];
      if (!subscribedEvents.includes(event.type) && !subscribedEvents.includes("*")) {
        continue;
      }

      const payload = JSON.stringify({
        event: event.type,
        entityId: event.entityId,
        data: event.data,
        timestamp: new Date().toISOString(),
      });

      await defaultQueue.add("WORKSPACE_WEBHOOK", {
        webhookId: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        payload: {
          event: event.type,
          entityId: event.entityId,
          data: event.data,
          timestamp: new Date().toISOString(),
        }
      });
      logger.info(`[Webhooks] Enqueued workspace webhook to ${webhook.url}`);
    }
  } catch (error) {
    logger.error(`[Webhooks] Failed to fire webhooks: ${String(error)}`);
  }
}
