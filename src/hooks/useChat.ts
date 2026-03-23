// Hook for support chat functionality
import { useCallback, useState } from "react";
import { SupportChat, SupportMessage } from "@/types/support";

export function useChat(chatId?: string) {
    const [chat, setChat] = useState<SupportChat | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch chat detail
    const fetchChat = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/support/chats/${id}`);
            if (!res.ok) throw new Error("Error fetching chat");
            const data = await res.json();
            setChat(data);
            setMessages(data.messages || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error unknown");
        } finally {
            setLoading(false);
        }
    }, []);

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!chatId) return;
        try {
            const res = await fetch(`/api/support/chats/${chatId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });
            if (!res.ok) throw new Error("Error sending message");
            const data = await res.json();
            setMessages(prev => [...prev, data]);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error unknown");
            throw err;
        }
    }, [chatId]);

    // Rate chat
    const rateChat = useCallback(async (rating: number, comment?: string) => {
        if (!chatId) return;
        try {
            const res = await fetch(`/api/support/chats/${chatId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, ratingComment: comment })
            });
            if (!res.ok) throw new Error("Error rating chat");
            const data = await res.json();
            setChat(data);
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error unknown");
            throw err;
        }
    }, [chatId]);

    return {
        chat,
        messages,
        loading,
        error,
        fetchChat,
        sendMessage,
        rateChat,
        setChat,
        setMessages
    };
}
