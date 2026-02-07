import { ENTRY_FEE } from './LudoConstants';

export class LudoEconomy {
    public static calculatePot(playerCount: number): number {
        const fee = ENTRY_FEE[playerCount as 2 | 3 | 4] || 50;
        return fee * playerCount;
    }

    public static calculateRewards(pot: number, rank: number, playerCount: number): number {
        // Zero-sum game:
        // 2 Players: Winner takes all (minus potentially small house rake if we wanted)
        // 3 Players: 1st (70%), 2nd (30%), 3rd (0)
        // 4 Players: 1st (60%), 2nd (30%), 3rd (10%), 4th (0)

        // Simplification for now:
        if (rank > 3) return 0; // 4th place gets nothing

        if (playerCount === 2) {
            return rank === 1 ? pot : 0;
        }

        if (playerCount === 3) {
            if (rank === 1) return Math.floor(pot * 0.7);
            if (rank === 2) return Math.floor(pot * 0.3);
            return 0;
        }

        if (playerCount === 4) {
            if (rank === 1) return Math.floor(pot * 0.6);
            if (rank === 2) return Math.floor(pot * 0.3);
            if (rank === 3) return Math.floor(pot * 0.1);
            return 0;
        }

        return 0;
    }
}
