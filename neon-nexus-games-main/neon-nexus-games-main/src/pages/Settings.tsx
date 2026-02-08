import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Globe,
  Shield,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  Loader2,
  Gamepad2,
  User,
  Save,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingToggleProps {
  icon: React.ElementType;
  iconOff: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function SettingToggle({ icon: Icon, iconOff: IconOff, label, description, enabled, onToggle }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:glow-card transition-all">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl transition-colors",
          enabled ? "gradient-primary" : "bg-muted"
        )}>
          {enabled
            ? <Icon className="w-5 h-5 text-primary-foreground" />
            : <IconOff className="w-5 h-5 text-muted-foreground" />
          }
        </div>
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "relative w-14 h-8 rounded-full transition-all",
          enabled ? "gradient-primary" : "bg-muted"
        )}
      >
        <span className={cn(
          "absolute top-1 w-6 h-6 rounded-full bg-primary-foreground transition-all shadow-md",
          enabled ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );
}

const themeDescriptions = {
  light: { icon: Sun, label: 'Light', desc: 'Clean and bright' },
  dark: { icon: Moon, label: 'Dark', desc: 'Easy on the eyes' },
  neon: { icon: Sparkles, label: 'Neon', desc: 'Vibrant and colorful' },
};

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const soundEnabled = profile?.sound_enabled ?? true;
  const notificationsEnabled = profile?.notifications_enabled ?? true;

  const handleSoundToggle = async () => {
    await updateProfile({ sound_enabled: !soundEnabled });
  };

  const handleNotificationsToggle = async () => {
    await updateProfile({ notifications_enabled: !notificationsEnabled });
  };

  // Username change state
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const handleUsernameChange = async () => {
    setUsernameError('');
    setUsernameSuccess('');

    // Validation
    if (!newUsername || newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    if (newUsername.length > 20) {
      setUsernameError('Username must be at most 20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (newUsername === profile?.username) {
      setUsernameError('This is already your username');
      return;
    }

    setIsSavingUsername(true);
    const { error } = await updateProfile({ username: newUsername });
    setIsSavingUsername(false);

    if (error) {
      // Handle unique constraint violation
      if (error.message?.includes('23505') || error.message?.includes('unique')) {
        setUsernameError('Username already taken');
      } else {
        setUsernameError(error.message || 'Failed to update username');
      }
    } else {
      setUsernameSuccess('Username updated!');
      setTimeout(() => setUsernameSuccess(''), 3000);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-3xl">
        <PageHeader
          title="Settings"
          subtitle="Customize your gaming experience"
        />

        {/* Account - Username */}
        <section className="mb-8 animate-fade-in">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Account
          </h3>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Username
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                    placeholder="Enter username"
                    maxLength={20}
                  />
                  <button
                    onClick={handleUsernameChange}
                    disabled={isSavingUsername}
                    className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingUsername ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              {usernameError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {usernameError}
                </div>
              )}

              {usernameSuccess && (
                <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm">
                  {usernameSuccess}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Theme Selection */}
        <section className="mb-8 animate-fade-in">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" />
            Theme
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.keys(themeDescriptions) as Array<keyof typeof themeDescriptions>).map((key) => {
              const { icon: Icon, label, desc } = themeDescriptions[key];
              const isActive = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all text-left",
                    isActive
                      ? "border-primary bg-primary/10 glow-card"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <Icon className={cn(
                    "w-8 h-8 mb-3",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="font-bold text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick Theme Switch */}
        <section className="mb-8 p-6 rounded-2xl bg-card border border-border glow-card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground mb-1">Quick Theme Switch</h3>
              <p className="text-sm text-muted-foreground">Use the theme switcher in the navbar for quick access</p>
            </div>
            <ThemeSwitcher />
          </div>
        </section>

        {/* Sound & Notifications */}
        <section className="mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Audio & Notifications
          </h3>
          <div className="space-y-4">
            <SettingToggle
              icon={Volume2}
              iconOff={VolumeX}
              label="Game Sound Effects"
              description="Play sounds for chess moves, captures, and DSA game events"
              enabled={soundEnabled}
              onToggle={handleSoundToggle}
            />
            <SettingToggle
              icon={Bell}
              iconOff={BellOff}
              label="Notifications"
              description="Receive alerts for game invites and achievements"
              enabled={notificationsEnabled}
              onToggle={handleNotificationsToggle}
            />
          </div>
        </section>

        {/* Game Settings Info */}
        <section className="mb-8 p-6 rounded-2xl bg-card border border-border animate-fade-in" style={{ animationDelay: '250ms' }}>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Game Controls
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-foreground">Chess Animations</span>
              <span className="text-muted-foreground">Toggle in Chess menu</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-foreground">Chess Board Theme</span>
              <span className="text-muted-foreground">Select in Board Shop</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-foreground">Coding Language</span>
              <span className="text-muted-foreground">Select per level</span>
            </div>
          </div>
        </section>

        {/* Other Settings */}
        <section className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            More Options
          </h3>
          <div className="space-y-2">
            {[
              { icon: Globe, label: 'Language', value: 'English' },
              { icon: Shield, label: 'Privacy', value: 'Manage' },
              { icon: HelpCircle, label: 'Help & Support', value: 'View' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:glow-card transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-muted">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">{item.label}</p>
                </div>
                <span className="text-muted-foreground">{item.value} →</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Settings;
