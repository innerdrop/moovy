
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("--- Debugging User Role ---");
    const email = "burger@somosmoovy.com";

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, name: true }
    });

    if (user) {
        console.log("User found:");
        console.log(user);
    } else {
        console.log("User NOT found: " + email);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
