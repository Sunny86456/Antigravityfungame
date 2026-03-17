import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
};

interface ConsumeRollRequest {
    rollId: string;
}

interface ConsumeRollResponse {
    success: boolean;
    error?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Extract authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            } as ConsumeRollResponse), {
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
            } as ConsumeRollResponse), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Parse request body
        const body: ConsumeRollRequest = await req.json();
        const { rollId } = body;

        if (!rollId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Roll ID required'
            } as ConsumeRollResponse), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Use service role client for database operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verify roll belongs to user and is not already consumed
        const { data: roll, error: fetchError } = await supabaseAdmin
            .from('dice_rolls')
            .select('id, user_id, consumed')
            .eq('roll_id', rollId)
            .single();

        if (fetchError || !roll) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Roll not found'
            } as ConsumeRollResponse), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Verify ownership
        if (roll.user_id !== user.id) {
            console.warn(`[consume-roll] Unauthorized access: user=${user.id} attempted to consume roll owned by ${roll.user_id}`);
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            } as ConsumeRollResponse), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Check if already consumed (replay attack)
        if (roll.consumed) {
            console.warn(`[consume-roll] Replay attack: rollId=${rollId} already consumed`);
            return new Response(JSON.stringify({
                success: false,
                error: 'Roll already consumed'
            } as ConsumeRollResponse), {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Mark as consumed
        const { error: updateError } = await supabaseAdmin
            .from('dice_rolls')
            .update({ consumed: true })
            .eq('id', roll.id);

        if (updateError) {
            console.error('[consume-roll] Update error:', updateError);
            return new Response(JSON.stringify({
                success: false,
                error: 'Failed to consume roll'
            } as ConsumeRollResponse), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`[consume-roll] Roll consumed: rollId=${rollId}, user=${user.id}`);

        return new Response(JSON.stringify({
            success: true
        } as ConsumeRollResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[consume-roll] Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Server error'
        } as ConsumeRollResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
