import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
};

/**
 * Rate Limit Configuration
 * Endpoint-specific thresholds for abuse prevention
 */
interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    lockoutMs: number;     // Lockout duration on abuse
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
    // Auth endpoints - aggressive limiting
    '/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 10, lockoutMs: 30 * 60 * 1000 },
    '/auth/signup': { windowMs: 15 * 60 * 1000, maxRequests: 5, lockoutMs: 60 * 60 * 1000 },
    '/auth/reset': { windowMs: 60 * 60 * 1000, maxRequests: 3, lockoutMs: 60 * 60 * 1000 },

    // Game endpoints
    '/game/roll': { windowMs: 60 * 1000, maxRequests: 60, lockoutMs: 5 * 60 * 1000 },

    // Match endpoints
    '/match/start': { windowMs: 60 * 1000, maxRequests: 5, lockoutMs: 10 * 60 * 1000 },
    '/match/end': { windowMs: 60 * 1000, maxRequests: 5, lockoutMs: 10 * 60 * 1000 },

    // Settings endpoints
    '/settings/username': { windowMs: 60 * 60 * 1000, maxRequests: 3, lockoutMs: 24 * 60 * 60 * 1000 },

    // Leaderboard
    '/leaderboard': { windowMs: 60 * 1000, maxRequests: 30, lockoutMs: 5 * 60 * 1000 },

    // Default for unspecified endpoints
    'default': { windowMs: 60 * 1000, maxRequests: 100, lockoutMs: 5 * 60 * 1000 },
};

interface RateLimitRequest {
    endpoint: string;
    // Session ID passed from auth - NOT user controlled
    sessionId?: string;
}

interface RateLimitResponse {
    allowed: boolean;
    remaining?: number;
    resetAt?: string;
    error?: string;
}

/**
 * API Rate Limiting Edge Function
 * 
 * SECURITY REQUIREMENTS:
 * - IP + session-based limits
 * - Endpoint-specific thresholds
 * - Temporary lockouts for abuse
 * - Silent failure messages (no sensitive data)
 */
serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get client IP (from headers set by proxy/edge)
        const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || 'unknown';

        // Parse request
        const body: RateLimitRequest = await req.json();
        const { endpoint, sessionId } = body;

        if (!endpoint) {
            return new Response(JSON.stringify({
                allowed: false,
                error: 'Invalid request'  // Silent - no details
            } as RateLimitResponse), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Build identifier (IP + session for authenticated users)
        const identifier = sessionId ? `${clientIP}:${sessionId}` : clientIP;

        // Get rate limit config for endpoint
        const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];

        // Use service role for database access
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const now = new Date();

        // Check for existing rate limit entry
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('rate_limits')
            .select('*')
            .eq('identifier', identifier)
            .eq('endpoint', endpoint)
            .single();

        // Check if currently locked out
        if (existing?.locked_until) {
            const lockoutEnd = new Date(existing.locked_until);
            if (now < lockoutEnd) {
                console.warn(`[rate-limiter] Locked out: ${identifier} on ${endpoint} until ${lockoutEnd.toISOString()}`);
                return new Response(JSON.stringify({
                    allowed: false,
                    resetAt: lockoutEnd.toISOString(),
                    error: 'Too many requests'  // Generic message
                } as RateLimitResponse), {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'Retry-After': Math.ceil((lockoutEnd.getTime() - now.getTime()) / 1000).toString()
                    },
                });
            }
        }

        // Check if within current window
        if (existing) {
            const windowStart = new Date(existing.window_start);
            const windowEnd = new Date(windowStart.getTime() + config.windowMs);

            if (now < windowEnd) {
                // Within window - check count
                if (existing.request_count >= config.maxRequests) {
                    // Exceeded limit - apply lockout
                    const lockoutEnd = new Date(now.getTime() + config.lockoutMs);

                    await supabaseAdmin
                        .from('rate_limits')
                        .update({
                            locked_until: lockoutEnd.toISOString(),
                            updated_at: now.toISOString()
                        })
                        .eq('id', existing.id);

                    console.warn(`[rate-limiter] Rate limit exceeded: ${identifier} on ${endpoint}, locked until ${lockoutEnd.toISOString()}`);

                    return new Response(JSON.stringify({
                        allowed: false,
                        resetAt: lockoutEnd.toISOString(),
                        error: 'Too many requests'  // Generic message
                    } as RateLimitResponse), {
                        status: 429,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json',
                            'Retry-After': Math.ceil(config.lockoutMs / 1000).toString()
                        },
                    });
                }

                // Increment counter
                await supabaseAdmin
                    .from('rate_limits')
                    .update({
                        request_count: existing.request_count + 1,
                        updated_at: now.toISOString()
                    })
                    .eq('id', existing.id);

                return new Response(JSON.stringify({
                    allowed: true,
                    remaining: config.maxRequests - existing.request_count - 1
                } as RateLimitResponse), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } else {
                // Window expired - reset
                await supabaseAdmin
                    .from('rate_limits')
                    .update({
                        request_count: 1,
                        window_start: now.toISOString(),
                        locked_until: null,
                        updated_at: now.toISOString()
                    })
                    .eq('id', existing.id);

                return new Response(JSON.stringify({
                    allowed: true,
                    remaining: config.maxRequests - 1
                } as RateLimitResponse), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // No existing entry - create new
        await supabaseAdmin
            .from('rate_limits')
            .insert({
                identifier,
                endpoint,
                request_count: 1,
                window_start: now.toISOString(),
                updated_at: now.toISOString()
            });

        return new Response(JSON.stringify({
            allowed: true,
            remaining: config.maxRequests - 1
        } as RateLimitResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[rate-limiter] Error:', error);
        // On error, allow the request (fail open for availability)
        // But log for monitoring
        return new Response(JSON.stringify({
            allowed: true,
            error: undefined  // No error exposed to client
        } as RateLimitResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
