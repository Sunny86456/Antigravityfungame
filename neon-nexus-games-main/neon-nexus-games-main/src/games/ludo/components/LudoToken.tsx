import React from 'react';
import { cn } from '@/lib/utils';

interface LudoTokenProps {
    color: 'red' | 'green' | 'yellow' | 'blue';
    isClickable?: boolean;
    isHighlighted?: boolean;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * 3D Ludo Pawn Token
 * Classic pawn shape: dome head + cylindrical body + wide base
 * With glossy 3D effect matching reference image
 */
export const LudoToken: React.FC<LudoTokenProps> = ({
    color,
    isClickable = false,
    isHighlighted = false,
    onClick,
    size = 'md'
}) => {
    // Color configurations with gradients for 3D effect
    const colorConfig = {
        red: {
            base: '#ef4444',
            light: '#f87171',
            dark: '#b91c1c',
            highlight: '#fca5a5',
            shadow: 'rgba(185, 28, 28, 0.5)',
        },
        green: {
            base: '#22c55e',
            light: '#4ade80',
            dark: '#15803d',
            highlight: '#86efac',
            shadow: 'rgba(21, 128, 61, 0.5)',
        },
        yellow: {
            base: '#eab308',
            light: '#facc15',
            dark: '#a16207',
            highlight: '#fef08a',
            shadow: 'rgba(161, 98, 7, 0.5)',
        },
        blue: {
            base: '#3b82f6',
            light: '#60a5fa',
            dark: '#1d4ed8',
            highlight: '#93c5fd',
            shadow: 'rgba(29, 78, 216, 0.5)',
        },
    };

    const sizeConfig = {
        sm: { width: 20, height: 28 },
        md: { width: 28, height: 38 },
        lg: { width: 36, height: 48 },
    };

    const config = colorConfig[color];
    const dimensions = sizeConfig[size];

    return (
        <div
            onClick={isClickable ? onClick : undefined}
            className={cn(
                "relative flex-shrink-0",
                isClickable && "cursor-pointer hover:scale-110 transition-transform duration-200",
                isHighlighted && "animate-bounce"
            )}
            style={{
                width: dimensions.width,
                height: dimensions.height,
            }}
        >
            {/* SVG Pawn Shape - Classic dome + body + base */}
            <svg
                viewBox="0 0 40 56"
                className="w-full h-full drop-shadow-lg"
                style={{
                    filter: `drop-shadow(0 4px 6px ${config.shadow})`,
                }}
            >
                <defs>
                    {/* Vertical gradient for 3D body effect */}
                    <linearGradient id={`bodyGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={config.dark} />
                        <stop offset="30%" stopColor={config.light} />
                        <stop offset="70%" stopColor={config.base} />
                        <stop offset="100%" stopColor={config.dark} />
                    </linearGradient>

                    {/* Radial gradient for dome head */}
                    <radialGradient id={`headGrad-${color}`} cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor={config.highlight} />
                        <stop offset="40%" stopColor={config.light} />
                        <stop offset="100%" stopColor={config.base} />
                    </radialGradient>

                    {/* Base gradient */}
                    <linearGradient id={`baseGrad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={config.base} />
                        <stop offset="100%" stopColor={config.dark} />
                    </linearGradient>
                </defs>

                {/* Shadow ellipse at bottom */}
                <ellipse
                    cx="20"
                    cy="54"
                    rx="14"
                    ry="2"
                    fill="rgba(0,0,0,0.2)"
                />

                {/* Base - wide flat ellipse */}
                <ellipse
                    cx="20"
                    cy="50"
                    rx="16"
                    ry="5"
                    fill={`url(#baseGrad-${color})`}
                />

                {/* Body - tapered cylinder */}
                <path
                    d={`
                        M 8,48
                        Q 8,38 12,28
                        Q 14,22 16,18
                        L 24,18
                        Q 26,22 28,28
                        Q 32,38 32,48
                        Q 32,52 20,52
                        Q 8,52 8,48
                        Z
                    `}
                    fill={`url(#bodyGrad-${color})`}
                />

                {/* Neck - narrow part below head */}
                <ellipse
                    cx="20"
                    cy="18"
                    rx="5"
                    ry="2"
                    fill={config.dark}
                />

                {/* Head - dome sphere */}
                <circle
                    cx="20"
                    cy="12"
                    r="10"
                    fill={`url(#headGrad-${color})`}
                />

                {/* Shine highlight on head */}
                <ellipse
                    cx="16"
                    cy="8"
                    rx="4"
                    ry="3"
                    fill="rgba(255,255,255,0.5)"
                />

                {/* Small specular highlight */}
                <circle
                    cx="14"
                    cy="7"
                    r="1.5"
                    fill="rgba(255,255,255,0.8)"
                />
            </svg>

            {/* Highlight ring for valid moves */}
            {isHighlighted && (
                <div
                    className="absolute -inset-1 rounded-full animate-pulse"
                    style={{
                        border: `2px solid ${config.highlight}`,
                        boxShadow: `0 0 12px ${config.light}`,
                    }}
                />
            )}
        </div>
    );
};

export default LudoToken;
