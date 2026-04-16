import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Habit } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, subDays, isSameDay, startOfWeek, addDays, differenceInDays } from 'date-fns';
import { CheckCircle2, Circle, Plus, Trash2, Loader2, Zap, Calendar as CalendarIcon, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface HabitTrackerProps {
  user: User;
}

export default function HabitTracker({ user }: HabitTrackerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();

  const calculateStreak = (completedDates: string[]) => {
    let streak = 0;
    let dateToCheck = new Date();
    const todayStr = format(dateToCheck, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(dateToCheck, 1), 'yyyy-MM-dd');

    // If not completed today AND not completed yesterday, streak is 0
    if (!completedDates.includes(todayStr) && !completedDates.includes(yesterdayStr)) {
      return 0;
    }

    // Start from today if completed, otherwise start from yesterday
    if (!completedDates.includes(todayStr)) {
      dateToCheck = subDays(dateToCheck, 1);
    }

    while (completedDates.includes(format(dateToCheck, 'yyyy-MM-dd'))) {
      streak++;
      dateToCheck = subDays(dateToCheck, 1);
    }

    return streak;
  };

  useEffect(() => {
    const q = query(
      collection(db, 'habits'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Habit[];
      setHabits(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'habits'), {
        userId: user.uid,
        name: newHabitName.trim(),
        completedDates: [],
        createdAt: serverTimestamp()
      });
      setNewHabitName('');
      toast.success('Habit added!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add habit');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleHabit = async (habit: Habit, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isCompleted = habit.completedDates.includes(dateStr);
    
    let newCompletedDates;
    if (isCompleted) {
      newCompletedDates = habit.completedDates.filter(d => d !== dateStr);
    } else {
      newCompletedDates = [...habit.completedDates, dateStr];
    }

    try {
      await updateDoc(doc(db, 'habits', habit.id!), {
        completedDates: newCompletedDates
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to update habit');
    }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    try {
      await deleteDoc(doc(db, 'habits', id));
      toast.success('Habit deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete habit');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Habit Tracker</h1>
          <p className="text-zinc-500">Build consistency with custom daily habits.</p>
        </div>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Add New Habit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addHabit} className="flex gap-2">
            <Input 
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 20 pages, Meditate, Cold shower"
              className="flex-1"
            />
            <Button type="submit" disabled={isAdding || !newHabitName.trim()}>
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {habits.length > 0 ? (
          habits.map(habit => (
            <Card key={habit.id} className="border-zinc-200 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <Zap className="text-white w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-zinc-900">{habit.name}</h3>
                </div>
                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                    <Flame className="w-3.5 h-3.5 fill-orange-600" />
                    <span className="text-xs font-bold">{calculateStreak(habit.completedDates)} day streak</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-500">
                    {habit.completedDates.length} total
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id!)} className="h-8 w-8 text-zinc-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-2">
                  {last7Days.map((date, i) => {
                    const isCompleted = habit.completedDates.includes(format(date, 'yyyy-MM-dd'));
                    const isToday = isSameDay(date, new Date());
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {format(date, 'EEE')}
                        </span>
                        <button
                          onClick={() => toggleHabit(habit, date)}
                          className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all border-2 ${
                            isCompleted 
                              ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                              : 'bg-white border-zinc-100 text-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>
                        <span className="text-[10px] text-zinc-400">{format(date, 'd')}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <CalendarIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900">No habits tracked yet</h3>
            <p className="text-zinc-500 mt-1">Add your first habit to start building consistency.</p>
          </div>
        )}
      </div>
    </div>
  );
}
