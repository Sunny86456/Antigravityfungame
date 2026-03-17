import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCoinEconomy } from '@/features/economy/useCoinEconomy';
import { Coins, History, TrendingUp, TrendingDown, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export function CoinDisplay({ className }: { className?: string }) {
  const { profile } = useAuth();
  const { getTransactionHistory } = useCoinEconomy();
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadHistory = async () => {
    setIsLoading(true);
    const history = await getTransactionHistory(20);
    setTransactions(history as Transaction[]);
    setIsLoading(false);
  };
  
  const handleToggleHistory = async () => {
    if (!showHistory) {
      await loadHistory();
    }
    setShowHistory(!showHistory);
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className={cn("relative", className)}>
      <button
        onClick={handleToggleHistory}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all"
      >
        <Coins className="w-5 h-5 text-coin" />
        <span className="font-bold">{profile?.coins ?? 0}</span>
        <History className="w-4 h-4 text-muted-foreground" />
      </button>
      
      {showHistory && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-card border border-border shadow-xl z-50">
          <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground">Transaction History</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 rounded-lg hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No transactions yet</div>
          ) : (
            <div className="p-2">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    tx.amount >= 0 ? "bg-success/20" : "bg-destructive/20"
                  )}>
                    {tx.amount >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  
                  <div className={cn(
                    "font-bold text-sm",
                    tx.amount >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
