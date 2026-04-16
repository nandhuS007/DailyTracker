import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { DailyEntry } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Calendar, TrendingUp, Brain, Target, Heart, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface HistoryProps {
  user: User;
}

export default function History({ user }: HistoryProps) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'entries'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyEntry[];
      setEntries(docs);
      if (docs.length > 0 && !selectedEntry) {
        setSelectedEntry(docs[0]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-dashed border-zinc-300 bg-zinc-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="w-12 h-12 text-zinc-300 mb-4" />
          <CardTitle className="text-xl font-semibold text-zinc-900">No entries yet</CardTitle>
          <CardDescription className="mt-2">
            Start your first accountability session to see your history here.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Past Entries
        </h2>
        <ScrollArea className="h-[calc(100vh-250px)] pr-4">
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card 
                key={entry.id}
                className={`cursor-pointer transition-all hover:border-zinc-400 ${
                  selectedEntry?.id === entry.id ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200'
                }`}
                onClick={() => setSelectedEntry(entry)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-zinc-900">
                      {format(new Date(entry.date), 'EEE, MMM do')}
                    </span>
                    <Badge variant={entry.mood >= 7 ? 'default' : entry.mood >= 4 ? 'secondary' : 'destructive'}>
                      Mood: {entry.mood}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {entry.accomplishments}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="lg:col-span-8">
        {selectedEntry && (
          <Card className="border-zinc-200 shadow-sm h-full">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-zinc-900">
                    {format(new Date(selectedEntry.date), 'MMMM do, yyyy')}
                  </CardTitle>
                  <CardDescription>Daily Accountability Summary</CardDescription>
                </div>
                <div className="flex gap-2">
                  {Object.entries(selectedEntry.habits).map(([habit, done]) => (
                    <div key={habit} title={habit} className={`p-1.5 rounded-md ${done ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-320px)]">
              <CardContent className="p-6 space-y-8">
                {selectedEntry.analysis && (
                  <div className="bg-zinc-900 text-white p-6 rounded-2xl space-y-4 shadow-xl">
                    <div className="flex items-center gap-2 text-zinc-400 uppercase tracking-widest text-[10px] font-bold">
                      <Brain className="w-3 h-3" />
                      Coach's Analysis
                    </div>
                    <div className="space-y-4">
                      <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed">
                        <ReactMarkdown>{selectedEntry.analysis.summary}</ReactMarkdown>
                      </div>
                      <Separator className="bg-zinc-800" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                            <TrendingUp className="w-3 h-3" />
                            PATTERN IDENTIFIED
                          </div>
                          <p className="text-sm font-medium">{selectedEntry.analysis.pattern}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                            <Target className="w-3 h-3" />
                            ACTIONABLE STEP
                          </div>
                          <p className="text-sm font-medium text-zinc-100 underline decoration-zinc-600 underline-offset-4">
                            {selectedEntry.analysis.actionableStep}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      Priorities
                    </h3>
                    <ul className="space-y-2">
                      {selectedEntry.priorities.map((p, i) => (
                        <li key={i} className="text-sm text-zinc-700 flex gap-3">
                          <span className="text-zinc-300 font-mono">{i + 1}</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Heart className="w-3 h-3" />
                      Gratitude
                    </h3>
                    <ul className="space-y-2">
                      {selectedEntry.gratitude.map((g, i) => (
                        <li key={i} className="text-sm text-zinc-700 flex gap-3">
                          <span className="text-zinc-300 font-mono">{i + 1}</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <Separator className="bg-zinc-100" />

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Accomplishments</h3>
                    <p className="text-sm text-zinc-700 leading-relaxed">{selectedEntry.accomplishments}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Biggest Distraction
                      </h3>
                      <p className="text-sm text-zinc-700">{selectedEntry.distraction}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Key Learning</h3>
                      <p className="text-sm text-zinc-700">{selectedEntry.learned}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">What Went Well</h3>
                      <p className="text-sm text-zinc-700">{selectedEntry.wentWell}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">For Tomorrow</h3>
                      <p className="text-sm text-zinc-700 font-medium">{selectedEntry.improvement}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}
