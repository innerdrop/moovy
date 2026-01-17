// Global store for points celebration popup
import { create } from "zustand";

interface PointsCelebrationState {
    isVisible: boolean;
    pointsEarned: number;
    showCelebration: (points: number) => void;
    hideCelebration: () => void;
}

export const usePointsCelebration = create<PointsCelebrationState>((set) => ({
    isVisible: false,
    pointsEarned: 0,
    showCelebration: (points: number) => set({ isVisible: true, pointsEarned: points }),
    hideCelebration: () => set({ isVisible: false, pointsEarned: 0 }),
}));
