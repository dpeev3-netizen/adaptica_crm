import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.error("No workspace found!");
    return;
  }

  const wId = workspace.id;

  console.log(`Using workspace ${wId}`);

  // Clean slate: erase existing deals, pipelines, and stages
  await prisma.deal.deleteMany({ where: { workspaceId: wId } });
  await prisma.pipeline.deleteMany({ where: { workspaceId: wId } });

  console.log("Deleted old pipelines and deals.");

  // Create Sales Pipeline with 3 explicit stages
  const pipeline = await prisma.pipeline.create({
    data: {
      workspaceId: wId,
      name: "Sales Pipeline",
      isDefault: true,
      stages: {
        create: [
          { name: "Negotiating", color: "#f59e0b", order: 0 },
          { name: "Won", color: "#10b981", order: 1 },
          { name: "Lost", color: "#ef4444", order: 2 },
        ]
      }
    },
    include: { stages: true }
  });

  const negotiatingStage = pipeline.stages.find((s: any) => s.name === "Negotiating");
  const wonStage = pipeline.stages.find((s: any) => s.name === "Won");

  // Helper to ensure dummy companies exist for the clients
  async function getCompany(name: string) {
    let comp = await prisma.company.findFirst({ where: { name, workspaceId: wId } });
    if (!comp) {
      comp = await prisma.company.create({ data: { name, workspaceId: wId } });
    }
    return comp;
  }

  const demos = await getCompany("Demos Real Estate");
  const stolichni = await getCompany("Stolichni Imoti");
  const drink = await getCompany("Drink Factory");
  const liberty = await getCompany("Liberty Studio Sofia");

  // Insert the requested deals
  await prisma.deal.createMany({
    data: [
      {
        workspaceId: wId,
        pipelineId: pipeline.id,
        stageId: wonStage!.id,
        companyId: demos.id,
        title: "Website with ChatBot Development and Brand ID",
        value: 2400
      },
      {
        workspaceId: wId,
        pipelineId: pipeline.id,
        stageId: wonStage!.id,
        companyId: stolichni.id,
        title: "ChatBot",
        value: 1000
      },
      {
        workspaceId: wId,
        pipelineId: pipeline.id,
        stageId: wonStage!.id,
        companyId: stolichni.id,
        title: "Logo and Campaign Optimisation",
        value: 1200
      },
      {
        workspaceId: wId,
        pipelineId: pipeline.id,
        stageId: negotiatingStage!.id,
        companyId: drink.id,
        title: "Full Marketing (Retainer)",
        value: 1500
      },
      {
        workspaceId: wId,
        pipelineId: pipeline.id,
        stageId: negotiatingStage!.id,
        companyId: liberty.id,
        title: "Wordpress Website Optimisation",
        value: 750
      }
    ]
  });

  console.log("Successfully seeded Sales Pipeline and Deals.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
