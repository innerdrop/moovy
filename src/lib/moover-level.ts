// Shared MOOVER level definitions — usable from server (API) and client (hooks/pages)

export interface MooverLevel {
    name: string;
    min: number;
    max: number;
    color: string;
}

export const MOOVER_LEVELS: MooverLevel[] = [
    { name: "Moover", min: 0, max: 299999, color: "#60A5FA" },
    { name: "Pro", min: 300000, max: 999999, color: "#818CF8" },
    { name: "Leyenda", min: 1000000, max: Infinity, color: "#F472B6" },
];

export function getMooverLevel(pointsLifetime: number): MooverLevel {
    return MOOVER_LEVELS.find(l => pointsLifetime >= l.min && pointsLifetime <= l.max) || MOOVER_LEVELS[0];
}

export function getNextLevelPoints(pointsLifetime: number): number {
    const currentLevel = getMooverLevel(pointsLifetime);
    const nextLevel = MOOVER_LEVELS.find(l => l.min > currentLevel.max);
    return nextLevel ? nextLevel.min : currentLevel.max;
}
