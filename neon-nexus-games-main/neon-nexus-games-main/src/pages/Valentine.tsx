import { Heart } from 'lucide-react';

export default function ValentinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-900 via-red-900 to-rose-900 relative overflow-hidden">
            {/* Floating hearts background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <Heart
                        key={i}
                        className="absolute text-pink-500/20 animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${20 + Math.random() * 40}px`,
                            height: `${20 + Math.random() * 40}px`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                        fill="currentColor"
                    />
                ))}
            </div>

            {/* Main content */}
            <div className="relative z-10 text-center px-6">
                <Heart
                    className="w-24 h-24 mx-auto mb-8 text-red-500 animate-pulse"
                    fill="currentColor"
                />

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                    Will You Be My
                </h1>

                <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-pink-400 via-red-400 to-rose-400 bg-clip-text text-transparent animate-pulse">
                    Valentine?
                </h2>

                <p className="mt-8 text-xl text-pink-200/80">
                    💕
                </p>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-pink-900/30 pointer-events-none" />
        </div>
    );
}
