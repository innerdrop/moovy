"use client";

// Hook for fetching user points balance
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

// Level definitions
const LEVELS = [
    { name: "Moover", min: 0, max: 299999, color: "#60A5FA" },
    { name: "Pro", min: 300000, max: 999999, color: "#818CF8" },
    { name: "Leyenda", min: 1000000, max: Infinity, color: "#F472B6" },
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

