"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await signIn("credentials", {
            email: email.toLowerCase().trim(),
            password,
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { success: false, error: "Credenciales inválidas" };
                default:
                    return { success: false, error: "Error de autenticación" };
            }
        }
        // Re-throw redirect errors (they're not actual errors)
        throw error;
    }
}
