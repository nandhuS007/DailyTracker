import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { DailyEntry, Habit, StudySession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Brain, TrendingUp, Calendar, Zap, Clock, Star } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface WeeklyReportProps {
  user: User;
}

export default function WeeklyReport({ user }: WeeklyReportProps) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    
    // Fetch entries
    const entriesQ = query(
      collection(db, 'entries'),
      where('userId', '==', user.uid),
      where('createdAt', '>=', sevenDaysAgo),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeEntries = onSnapshot(entriesQ, (snapshot) => {
      setEntries(snapshot.docs.map(doc => doc.data() as DailyEntry));
    });

    // Fetch habits
    const habitsQ = query(
      collection(db, 'habits'),
      where('userId', '==', user.uid)
    );

    const unsubscribeHabits = onSnapshot(habitsQ, (snapshot) => {
      setHabits(snapshot.docs.map(doc => doc.data() as Habit));
    });

    // Fetch study sessions
    const studyQ = query(
      collection(db, 'studySessions'),
      where('userId', '==', user.uid),
      where('createdAt', '>=', sevenDaysAgo)
    );

    const unsubscribeStudy = onSnapshot(studyQ, (snapshot) => {
      setStudySessions(snapshot.docs.map(doc => doc.data() as StudySession));
    });

    return () => {
      unsubscribeEntries();
      unsubscribeHabits();
      unsubscribeStudy();
    };
  }, [user.uid]);

  useEffect(() => {
    if (entries.length > 0 && !aiSummary && !loadingAi) {
      generateAiSummary();
    }
  }, [entries]);

  const generateAiSummary = async () => {
    setLoadingAi(true);
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      const dataStr = entries.map(e => `
        Date: ${format(e.timestamp.toDate(), 'MMM d')}
        Mood: ${e.mood}/10
        Priorities: ${e.priorities.join(', ')}
        Habits: ${JSON.stringify(e.habits)}
        Distractions: ${e.distraction}
      `).join('\n');

      const prompt = `
        As an accountability coach, analyze the following 7 days of data and provide a concise weekly summary.
        Identify the biggest win of the week, the main recurring distraction, and one specific piece of advice for next week.
        Keep it professional, encouraging, but firm.
        
        Data:
        ${dataStr}
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      setAiSummary(result.text || "No summary available.");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAi(false);
    }
  };

  const moodData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'MMM d');
    const entry = entries.find(e => isSameDay(e.timestamp.toDate(), date));
    return {
      name: dateStr,
      mood: entry ? entry.mood : null
    };
  });

  const studyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'EEE');
    const daySessions = studySessions.filter(s => isSameDay(s.timestamp.toDate(), date));
    const totalMinutes = daySessions.reduce((acc, s) => acc + s.duration, 0);
    return {
      name: dateStr,
      hours: parseFloat((totalMinutes / 60).toFixed(1))
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-zinc-400" />
              <CardTitle>Mood Trend</CardTitle>
            </div>
            <CardDescription>Your emotional well-being over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#18181b" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#18181b' }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              <CardTitle>Study Hours</CardTitle>
            </div>
            <CardDescription>Time spent in focused study sessions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="hours" fill="#18181b" radius={[4, 4, 0, 0]}>
                  {studyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hours > 2 ? '#18181b' : '#a1a1aa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-900 text-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-zinc-400" />
            <CardTitle>AI Weekly Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAi ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              Analyzing your week...
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
              {aiSummary || "Log more entries to get a weekly summary."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}
