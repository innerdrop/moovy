
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("--- Debugging Login Logic ---");
    const email = "burger@somosmoovy.com";
    const passwordInput = "merchant123";

    console.log(`Checking credentials for: ${email}`);
    console.log(`Password to test: ${passwordInput}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log("❌ User NOT found in DB!");
        return;
    }

    console.log("✅ User found in DB.");
    console.log("Stored Password Hash:", user.password);

    const isValid = await bcrypt.compare(passwordInput, user.password);

    if (isValid) {
        console.log("✅ Password MATCHES! bcrypt.compare returned true.");
    } else {
        console.log("❌ Password DOES NOT MATCH! bcrypt.compare returned false.");

        // Test generating a new hash to see what it looks like
        const newHash = await bcrypt.hash(passwordInput, 10);
        console.log("New sample hash for 'merchant123':", newHash);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
