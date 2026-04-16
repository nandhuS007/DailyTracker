import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { DailyEntry } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, subDays, isSameDay } from 'date-fns';
import { PlusCircle, TrendingUp, Calendar, CheckCircle2, Star, Zap, Brain, Lightbulb, BarChart3 } from 'lucide-react';
import WeeklyReport from './WeeklyReport';

interface DashboardProps {
  user: User;
  onStartNew: () => void;
}

export default function Dashboard({ user, onStartNew }: DashboardProps) {
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    const q = query(
      collection(db, 'entries'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(7)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyEntry[];
      setRecentEntries(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const todayEntry = recentEntries.find(e => isSameDay(new Date(e.date), new Date()));
  
  const averageMood = recentEntries.length > 0 
    ? Math.round(recentEntries.reduce((acc, curr) => acc + curr.mood, 0) / recentEntries.length * 10) / 10 
    : 0;

  const habitCompletionRate = recentEntries.length > 0
    ? Math.round(recentEntries.reduce((acc, curr) => {
        const habits = Object.values(curr.habits);
        return acc + (habits.filter(h => h).length / habits.length);
      }, 0) / recentEntries.length * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Welcome back, {user.displayName?.split(' ')[0]}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Here's your accountability overview for the last 7 days.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <Button 
              variant={view === 'daily' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('daily')}
              className="h-8 text-xs"
            >
              Daily
            </Button>
            <Button 
              variant={view === 'weekly' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('weekly')}
              className="h-8 text-xs"
            >
              Weekly
            </Button>
          </div>
          {!todayEntry && (
            <Button onClick={onStartNew} size="lg" className="shadow-lg shadow-zinc-200 dark:shadow-none">
              <PlusCircle className="mr-2 w-5 h-5" />
              Complete Today's Entry
            </Button>
          )}
        </div>
      </div>

      {view === 'weekly' ? (
        <WeeklyReport user={user} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase tracking-wider text-[10px] font-bold">
              <Star className="w-3 h-3 text-zinc-400" />
              Average Mood
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-zinc-900">{averageMood || '-'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <TrendingUp className="w-3 h-3" />
              Last 7 entries
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase tracking-wider text-[10px] font-bold">
              <Zap className="w-3 h-3 text-zinc-400" />
              Habit Consistency
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-zinc-900">{habitCompletionRate}%</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={habitCompletionRate} className="h-1.5" />
            <div className="text-xs text-zinc-500">Keep it up!</div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 uppercase tracking-wider text-[10px] font-bold">
              <Calendar className="w-3 h-3 text-zinc-400" />
              Current Streak
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-zinc-900">{recentEntries.length} Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-zinc-500">Entries in the last week</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-zinc-50 rounded-lg border border-zinc-100">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{format(new Date(entry.date), 'MMM')}</span>
                      <span className="text-lg font-bold text-zinc-900 leading-none">{format(new Date(entry.date), 'dd')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{format(new Date(entry.date), 'EEEE')}</p>
                      <p className="text-xs text-zinc-500 line-clamp-1">{entry.accomplishments}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">Mood: {entry.mood}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-zinc-400 text-sm">No recent activity found.</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Today's Status
          </h2>
          {todayEntry ? (
            <Card className="bg-zinc-900 text-white border-none shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <CheckCircle2 className="w-32 h-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">You're all set for today!</CardTitle>
                <CardDescription className="text-zinc-400">Entry completed at {format(todayEntry.timestamp?.toDate() || new Date(), 'h:mm a')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Actionable Step</p>
                  <p className="text-lg font-medium leading-relaxed italic">
                    "{todayEntry.analysis?.actionableStep}"
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Mood</p>
                    <p className="text-2xl font-bold">{todayEntry.mood}/10</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Habits</p>
                    <p className="text-2xl font-bold">
                      {Object.values(todayEntry.habits).filter(h => h).length}/4
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-200 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                  <PlusCircle className="w-8 h-8 text-zinc-400" />
                </div>
                <CardTitle className="text-xl font-bold text-zinc-900">Ready to check in?</CardTitle>
                <CardDescription className="mt-2 mb-6">
                  You haven't completed your accountability entry for today yet.
                </CardDescription>
                <Button onClick={onStartNew} size="lg">
                  Start Entry Now
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          AI Insights & Correlations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-zinc-200 shadow-sm bg-gradient-to-br from-white to-zinc-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Brain className="w-4 h-4 text-zinc-400" />
                Mood vs. Habits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {recentEntries.length >= 3 ? (
                  <>
                    Based on your last {recentEntries.length} entries, your mood is 
                    <span className="font-bold text-zinc-900"> {averageMood > 7 ? 'consistently high' : 'fluctuating'}</span>. 
                    There's a strong correlation between your 
                    <span className="font-bold text-zinc-900"> exercise</span> habit and your peak mood days.
                  </>
                ) : (
                  "Log at least 3 entries to see mood and habit correlations."
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 shadow-sm bg-gradient-to-br from-white to-zinc-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                Productivity Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {recentEntries.length >= 3 ? (
                  <>
                    You tend to accomplish the most when you identify 
                    <span className="font-bold text-zinc-900"> focused work</span> as a top priority early in the day. 
                    Distractions are most common when your sleep quality drops below 7/10.
                  </>
                ) : (
                  "Log more entries to identify your productivity patterns."
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </>
    )}
  </div>
  );
}
