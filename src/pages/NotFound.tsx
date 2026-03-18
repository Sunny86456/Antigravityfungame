import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from '@/components/Layout';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl glass-surface-2 p-10 text-center animate-rise">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Lost In The Lobby</p>
          <h1 className="mb-4 text-6xl font-bold gradient-text neon-text">404</h1>
          <p className="mb-6 text-xl text-muted-strong">This page does not exist, or the route has moved.</p>
          <a href="/" className="inline-flex items-center justify-center rounded-xl gradient-primary px-6 py-3 font-semibold text-primary-foreground glow-primary hover:opacity-90">
            Return to Home
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
