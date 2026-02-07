/**
 * Ludo Service Layer
 * Handles secure server communication for dice rolls
 * Security Item 1: Server-Generated RNG Implementation
 */

import { supabase } from '@/integrations/supabase/client';

// Supabase Edge Function URLs
const SUPABASE_URL = 'https://pvjosidukxihrzsykwfr.supabase.co';

export interface DiceRollResponse {
    success: boolean;
    rollId?: string;
    value?: number;
    turnNumber?: number;
    error?: string;
}

export interface ConsumeRollResponse {
    success: boolean;
    error?: string;
}

/**
 * Request a cryptographically secure dice roll from the server
 * The server generates the roll using crypto.getRandomValues()
 * 
 * @param matchId - The unique match identifier
 * @param turnNumber - Current turn number in the match
 * @returns Promise with roll ID, dice value, and turn number
 */
export async function requestDiceRoll(
    matchId: string,
    turnNumber: number
): Promise<DiceRollResponse> {
    try {
        // Get current session for authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/roll-dice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                matchId,
                turnNumber
            }),
        });

        const data: DiceRollResponse = await response.json();

        if (!response.ok) {
            console.error('[ludoService] Roll request failed:', data.error);
            return { success: false, error: data.error || 'Failed to roll dice' };
        }

        return data;
    } catch (error) {
        console.error('[ludoService] Network error:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Mark a dice roll as consumed (used)
 * This prevents replay attacks where the same roll is used multiple times
 * 
 * @param rollId - The unique roll identifier from requestDiceRoll
 * @returns Promise indicating success or failure
 */
export async function consumeRoll(rollId: string): Promise<ConsumeRollResponse> {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/consume-roll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ rollId }),
        });

        const data: ConsumeRollResponse = await response.json();

        if (!response.ok) {
            console.error('[ludoService] Consume roll failed:', data.error);
            return { success: false, error: data.error || 'Failed to consume roll' };
        }

        return data;
    } catch (error) {
        console.error('[ludoService] Network error:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Generate a new match ID
 * Uses crypto.randomUUID() for a cryptographically secure ID
 */
export function generateMatchId(): string {
    return crypto.randomUUID();
}
