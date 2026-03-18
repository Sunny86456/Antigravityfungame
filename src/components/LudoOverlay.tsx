import { X } from 'lucide-react';

interface LudoOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LudoOverlay({ isOpen, onClose }: LudoOverlayProps) {
    if (!isOpen) return null;

    const handleClose = () => {
        // Clear config
        // @ts-expect-error - External library types mismatch
        delete window.__LUDO_CONFIG__;
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-in fade-in duration-300 backdrop-blur-sm">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                <button
                    onClick={handleClose}
                    className="p-3 rounded-full glass-surface-2 text-destructive hover:scale-105 transition-all shadow-lg"
                    title="Exit Game"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Game Frame */}
            <iframe
                src="/ludo.html"
                className="w-full h-full border-none"
                allow="autoplay"
                title="Ludo Game"
            />
        </div>
    );
}
