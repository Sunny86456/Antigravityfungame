import { Toaster } from "@/shared/ui/toaster";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Games from "./pages/Games";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Games
import CodingGame from "./games/coding/CodingGame";
import ChessGame from "./games/chess/ChessGame";
import ChessLearningHub from "./games/chess/learning/ChessLearningHub";
import ChessTutorialEngine from "./games/chess/learning/ChessTutorialEngine";
import ChessPuzzle from "./games/chess/learning/ChessPuzzle";
import ChessPractice from "./games/chess/learning/ChessPractice";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/coding" element={<CodingGame />} />
              <Route path="/games/chess" element={<ChessGame />} />
              <Route path="/games/chess/learn" element={<ChessLearningHub />} />
              <Route path="/games/chess/learn/:id" element={<ChessTutorialEngine />} />
              <Route path="/games/chess/puzzle/:id" element={<ChessPuzzle />} />
              <Route path="/games/chess/practice" element={<ChessPractice />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
