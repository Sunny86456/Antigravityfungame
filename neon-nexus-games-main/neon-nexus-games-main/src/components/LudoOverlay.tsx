import { X } from 'lucide-react';

interface LudoOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LudoOverlay({ isOpen, onClose }: LudoOverlayProps) {
    if (!isOpen) return null;

    const handleClose = () => {
        // Clear config
        // @ts-ignore
        delete window.__LUDO_CONFIG__;
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                <button
                    onClick={handleClose}
                    className="p-3 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg backdrop-blur-sm"
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
