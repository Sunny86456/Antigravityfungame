import { Navbar } from './Navbar';
import { Instagram, Linkedin, Mail, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

import { useLocation } from 'react-router-dom';

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isGameRoute = location.pathname.startsWith('/games/') && location.pathname !== '/games';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="pt-24 md:pt-20 pb-8 flex-1">
        {children}
      </main>

      {!isGameRoute && (
        <footer className="border-t border-border bg-muted/30 py-6">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground">© {new Date().getFullYear()}</span>
              <User className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Sunny Shah</span>
              <span className="text-muted-foreground">— All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="mailto:sunny93wo@gmail.com" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">sunny93wo@gmail.com</span>
              </a>
              <a href="https://www.instagram.com/sunny.shah22?igsh=MXd4bXgxdjA0ZXpiZA==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Instagram className="w-4 h-4" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
              <a href="https://www.linkedin.com/in/sunny2k2p23?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Linkedin className="w-4 h-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
