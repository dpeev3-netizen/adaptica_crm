import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Update existing deals with their correct product names
  const deals = await prisma.deal.findMany();

  for (const deal of deals) {
    let product = "";
    switch (deal.title) {
      case "Website with ChatBot Development and Brand ID":
        product = "Website with ChatBot Development and Brand ID";
        break;
      case "ChatBot":
        product = "ChatBot";
        break;
      case "Logo and Campaign Optimisation":
        product = "Logo and Campaign Optimisation";
        break;
      case "Full Marketing (Retainer)":
        product = "Full Marketing";
        break;
      case "Wordpress Website Optimisation":
        product = "Wordpress Website Optimisation";
        break;
      default:
        product = deal.title;
    }

    await prisma.deal.update({
      where: { id: deal.id },
      data: { product },
    });
  }

  console.log(`Updated ${deals.length} deals with product names.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
