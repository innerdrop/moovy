"use client";

// Hook for fetching user points balance
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface UseUserPointsReturn {
    points: number;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useUserPoints(): UseUserPointsReturn {
    const { data: session, status } = useSession();
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPoints = async () => {
        if (status !== "authenticated" || !session?.user) {
            setPoints(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch("/api/points");
            if (res.ok) {
                const data = await res.json();
                setPoints(data.balance || 0);
            } else {
                setError("Failed to fetch points");
            }
        } catch (err) {
            console.error("Error fetching points:", err);
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "loading") return;
        fetchPoints();
    }, [status, session?.user?.id]);

    return { points, loading, error, refetch: fetchPoints };
}
