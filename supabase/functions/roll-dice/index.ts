import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
};

interface RollDiceRequest {
  matchId: string;
  turnNumber: number;
}

interface RollDiceResponse {
  success: boolean;
  rollId?: string;
  value?: number;
  turnNumber?: number;
  error?: string;
}

/**
 * Generate cryptographically secure random dice value (1-6)
 * Uses Web Crypto API for security
 */
function generateSecureDiceValue(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Use modulo to get 0-5, then add 1 for 1-6
  return (array[0] % 6) + 1;
}

/**
 * Generate a unique roll ID using crypto
 */
function generateRollId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract authorization header for session validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      } as RollDiceResponse), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user session
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid session'
      } as RollDiceResponse), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: RollDiceRequest = await req.json();
    const { matchId, turnNumber } = body;

    // Validate required fields
    if (!matchId || turnNumber === undefined || turnNumber < 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request parameters'
      } as RollDiceResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for existing roll for this match+turn+user (replay prevention)
    const { data: existingRoll, error: checkError } = await supabaseAdmin
      .from('dice_rolls')
      .select('roll_id, dice_value, consumed')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .eq('turn_number', turnNumber)
      .single();

    if (existingRoll) {
      // Roll already exists for this turn
      if (existingRoll.consumed) {
        // Already used - replay attack detected
        console.warn(`[roll-dice] Replay attack detected: user=${user.id}, match=${matchId}, turn=${turnNumber}`);
        return new Response(JSON.stringify({
          success: false,
          error: 'Roll already consumed'
        } as RollDiceResponse), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Return existing unconsumed roll
      return new Response(JSON.stringify({
        success: true,
        rollId: existingRoll.roll_id,
        value: existingRoll.dice_value,
        turnNumber: turnNumber
      } as RollDiceResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new cryptographically secure dice roll
    const diceValue = generateSecureDiceValue();
    const rollId = generateRollId();

    console.log(`[roll-dice] Generating roll: user=${user.id}, match=${matchId}, turn=${turnNumber}, value=${diceValue}`);

    // Store roll in audit table
    const { error: insertError } = await supabaseAdmin
      .from('dice_rolls')
      .insert({
        roll_id: rollId,
        match_id: matchId,
        user_id: user.id,
        turn_number: turnNumber,
        dice_value: diceValue,
        consumed: false
      });

    if (insertError) {
      console.error('[roll-dice] Insert error:', insertError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to record roll'
      } as RollDiceResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      rollId: rollId,
      value: diceValue,
      turnNumber: turnNumber
    } as RollDiceResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[roll-dice] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Server error'
    } as RollDiceResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
