import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LogIn, LogOut, LayoutDashboard, History as HistoryIcon, PlusCircle, BookOpen, Zap, Brain, Settings as SettingsIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Coach from '@/components/Coach/Coach';
import History from '@/components/History/History';
import Dashboard from '@/components/Dashboard/Dashboard';
import Study from '@/components/Study/Study';
import HabitTracker from '@/components/Habits/HabitTracker';
import CoachChat from '@/components/Coach/CoachChat';
import Settings from '@/components/Settings/Settings';
import { useNotifications } from '@/hooks/useNotifications';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'coach' | 'history' | 'study' | 'habits' | 'chat' | 'settings'>('dashboard');

  useNotifications(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to login. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-zinc-200 rounded-full"></div>
          <div className="h-4 w-32 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-200 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-4">
              <PlusCircle className="text-white w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Daily Coach</CardTitle>
            <CardDescription>
              Your daily accountability partner. Track moods, habits, and learn from your day.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleLogin} className="w-full h-12 text-base font-medium" size="lg">
              <LogIn className="mr-2 w-5 h-5" />
              Sign in with Google
            </Button>
            <p className="text-xs text-center text-zinc-500">
              By signing in, you agree to track your daily progress and be honest with yourself.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <PlusCircle className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-zinc-900 hidden sm:inline-block">Daily Coach</span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('dashboard')}
              className="px-2 sm:px-3"
            >
              <LayoutDashboard className="w-4 h-4 sm:mr-2" />
              <span className="hidden lg:inline">Dashboard</span>
            </Button>
            <Button 
              variant={activeTab === 'study' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('study')}
              className="px-2 sm:px-3"
            >
              <BookOpen className="w-4 h-4 sm:mr-2" />
              <span className="hidden lg:inline">Study</span>
            </Button>
            <Button 
              variant={activeTab === 'habits' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('habits')}
              className="px-2 sm:px-3"
            >
              <Zap className="w-4 h-4 sm:mr-2" />
              <span className="hidden lg:inline">Habits</span>
            </Button>
            <Button 
              variant={activeTab === 'chat' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('chat')}
              className="px-2 sm:px-3"
            >
              <Brain className="w-4 h-4 sm:mr-2" />
              <span className="hidden lg:inline">AI Coach</span>
            </Button>
            <Button 
              variant={activeTab === 'coach' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('coach')}
              className="px-2 sm:px-3"
            >
              <PlusCircle className="w-4 h-4 sm:mr-2" />
              <span className="hidden lg:inline">New Entry</span>
            </Button>
            <Button 
              variant={activeTab === 'history' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('history')}
              className="px-2 sm:px-3"
            >
              <HistoryIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden lg:inline">History</span>
            </Button>
            <Button 
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('settings')}
              className="px-2 sm:px-3"
            >
              <SettingsIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden lg:inline">Settings</span>
            </Button>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-zinc-900">{user.displayName}</span>
              <span className="text-xs text-zinc-500">{user.email}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-500 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && <Dashboard user={user} onStartNew={() => setActiveTab('coach')} />}
        {activeTab === 'coach' && <Coach user={user} onComplete={() => setActiveTab('history')} />}
        {activeTab === 'history' && <History user={user} />}
        {activeTab === 'study' && <Study user={user} />}
        {activeTab === 'habits' && <HabitTracker user={user} />}
        {activeTab === 'chat' && <CoachChat user={user} />}
        {activeTab === 'settings' && <Settings user={user} />}
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}
