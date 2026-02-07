import { useRef } from 'react';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';

const LudoHome = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-4 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-20 left-10 w-64 h-64 bg-red-500 rounded-full blur-[100px]" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500 rounded-full blur-[150px] opacity-20" />
                </div>

                <div className="container mx-auto relative z-10 max-w-4xl">
                    <Link to="/games" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Games</span>
                    </Link>

                    <div className="text-center mb-16 space-y-6">
                        <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-3xl border border-white/10 mb-4 shadow-2xl shadow-purple-500/20">
                            <Gamepad2 className="w-16 h-16 text-transparent bg-clip-text bg-gradient-to-br from-red-400 via-green-400 to-blue-400 animate-pulse" style={{ backgroundImage: 'linear-gradient(to bottom right, #f87171, #4ade80, #60a5fa)' }} />
                        </div>

                        <h1 className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 tracking-tight pb-2">
                            LUDO MASTER
                        </h1>

                        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Experience the classic board game re-imagined. Play against smart AI bots, challenge friends locally, or compete online to climb the global leaderboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {/* Play vs AI (Available) */}
                        <div onClick={() => navigate('/games/ludo/play')} className="group relative p-1 rounded-3xl bg-gradient-to-b from-white/20 to-white/5 hover:from-green-400/50 hover:to-blue-400/50 transition-all duration-500 cursor-pointer hover:scale-[1.02] shadow-xl hover:shadow-green-500/20">
                            <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative h-full bg-slate-900/90 rounded-[22px] p-8 flex flex-col items-center text-center backdrop-blur-sm border border-white/10 group-hover:border-white/20">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center mb-6 shadow-lg shadow-green-900/50 group-hover:scale-110 transition-transform duration-500">
                                    <Gamepad2 className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Play vs AI</h3>
                                <p className="text-slate-400 mb-6">Train your skills against 3 smart computer opponents. Perfect for quick matches.</p>
                                <span className="mt-auto px-6 py-2 rounded-full bg-white/10 text-white font-medium group-hover:bg-green-500 group-hover:text-black transition-colors">
                                    Play Now
                                </span>
                            </div>
                        </div>

                        {/* Online Multiplayer (Coming Soon) */}
                        <div className="group relative p-1 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 opacity-75 cursor-not-allowed">
                            <div className="relative h-full bg-slate-900/90 rounded-[22px] p-8 flex flex-col items-center text-center backdrop-blur-sm border border-white/5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center mb-6 shadow-lg shadow-blue-900/50 grayscale group-hover:grayscale-0 transition-all">
                                    <span className="text-2xl font-black text-white">VS</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Online Ranked</h3>
                                <p className="text-slate-500 mb-6">Compete against real players worldwide. Earn coins and climb ranks.</p>
                                <span className="mt-auto px-4 py-1.5 rounded-full bg-white/5 text-slate-500 text-xs font-bold border border-white/10 uppercase tracking-widest">
                                    Coming Soon
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LudoHome;
