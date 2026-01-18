"use client";

// Hook for fetching user points balance
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

// Level definitions
const LEVELS = [
    { name: "Bronce", min: 0, max: 499, color: "#CD7F32" },
    { name: "Plata", min: 500, max: 1499, color: "#C0C0C0" },
    { name: "Oro", min: 1500, max: 4999, color: "#FFD700" },
    { name: "Platino", min: 5000, max: 9999, color: "#E5E4E2" },
    { name: "Diamante", min: 10000, max: Infinity, color: "#B9F2FF" },
];

interface Level {
    name: string;
    min: number;
    max: number;
    color: string;
}

interface UseUserPointsReturn {
    points: number;
    loading: boolean;
    error: string | null;
    level: Level;
    nextLevelPoints: number;
    refetch: () => Promise<void>;
}

function getLevel(points: number): Level {
    return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0];
}

function getNextLevelPoints(points: number): number {
    const currentLevel = getLevel(points);
    const nextLevel = LEVELS.find(l => l.min > currentLevel.max);
    return nextLevel ? nextLevel.min : currentLevel.max;
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

    const level = useMemo(() => getLevel(points), [points]);
    const nextLevelPoints = useMemo(() => getNextLevelPoints(points), [points]);

    return { points, loading, error, level, nextLevelPoints, refetch: fetchPoints };
}

