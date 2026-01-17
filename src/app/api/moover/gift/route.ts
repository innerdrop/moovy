// API Route for gifting points to another user
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST - Gift points to another user
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { recipientEmail, amount } = body;

        // Validate input
        if (!recipientEmail || !amount) {
            return NextResponse.json({ error: "Email y cantidad son requeridos" }, { status: 400 });
        }

        const pointsAmount = parseInt(amount);
        if (isNaN(pointsAmount) || pointsAmount < 100) {
            return NextResponse.json({ error: "El mínimo para regalar es 100 puntos" }, { status: 400 });
        }

        // Get sender
        const sender = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, pointsBalance: true, email: true, name: true }
        });

        if (!sender) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Can't gift to yourself
        if (sender.email?.toLowerCase() === recipientEmail.toLowerCase()) {
            return NextResponse.json({ error: "No podés regalarte puntos a vos mismo" }, { status: 400 });
        }

        // Check sender has enough points (max 50% of balance)
        const maxGiftable = Math.floor(sender.pointsBalance * 0.5);
        if (pointsAmount > maxGiftable) {
            return NextResponse.json({
                error: `Solo podés regalar hasta el 50% de tu balance (${maxGiftable} puntos)`
            }, { status: 400 });
        }

        if (pointsAmount > sender.pointsBalance) {
            return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
        }

        // Get recipient
        const recipient = await prisma.user.findUnique({
            where: { email: recipientEmail.toLowerCase() },
            select: { id: true, pointsBalance: true, name: true }
        });

        if (!recipient) {
            return NextResponse.json({ error: "El usuario destinatario no existe" }, { status: 404 });
        }

        // Perform the transfer in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Deduct from sender
            const updatedSender = await tx.user.update({
                where: { id: sender.id },
                data: { pointsBalance: { decrement: pointsAmount } }
            });

            // Add to recipient
            const updatedRecipient = await tx.user.update({
                where: { id: recipient.id },
                data: { pointsBalance: { increment: pointsAmount } }
            });

            const senderName = sender.name || "un amigo";
            const recipientName = recipient.name || recipientEmail;

            // Create transaction record for sender
            await tx.pointsTransaction.create({
                data: {
                    userId: sender.id,
                    type: "GIFT_SENT",
                    amount: -pointsAmount,
                    balanceAfter: updatedSender.pointsBalance,
                    description: `Regalo de ${pointsAmount} puntos a ${recipientName}`
                }
            });

            // Create transaction record for recipient
            await tx.pointsTransaction.create({
                data: {
                    userId: recipient.id,
                    type: "GIFT_RECEIVED",
                    amount: pointsAmount,
                    balanceAfter: updatedRecipient.pointsBalance,
                    description: `Regalo de ${pointsAmount} puntos de ${senderName}`
                }
            });

            return {
                newBalance: updatedSender.pointsBalance,
                recipientName
            };
        });

        return NextResponse.json({
            success: true,
            message: `¡Regalaste ${pointsAmount} puntos exitosamente!`,
            newBalance: result.newBalance,
            recipientName: result.recipientName
        });

    } catch (error) {
        console.error("Error gifting points:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
