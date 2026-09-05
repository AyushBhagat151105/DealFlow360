import prisma from "@DealFlow360/db";
import { runSeed } from "./seed/index.js";

runSeed()
  .catch((e) => {
    console.error("Seed execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
