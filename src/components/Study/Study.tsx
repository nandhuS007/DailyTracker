import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { StudySession } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { BookOpen, Upload, Loader2, Plus, Clock, FileText, ImageIcon, Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface StudyProps {
  user: User;
}

export default function Study({ user }: StudyProps) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  
  const [newSession, setNewSession] = useState({
    subject: '',
    duration: 30,
    notes: '',
    file: null as File | null
  });

  const [timer, setTimer] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((timer) => timer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsActive(false);
      toast.success('Focus session complete! Take a break.');
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudySession[];
      setSessions(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.subject) return;

    setIsUploading(true);
    try {
      let imageUrl = '';
      if (newSession.file) {
        const fileRef = ref(storage, `study/${user.uid}/${Date.now()}_${newSession.file.name}`);
        await uploadBytes(fileRef, newSession.file);
        imageUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, 'studySessions'), {
        userId: user.uid,
        subject: newSession.subject,
        duration: Number(newSession.duration),
        notes: newSession.notes,
        imageUrl,
        timestamp: serverTimestamp()
      });

      toast.success('Study session logged!');
      setNewSession({ subject: '', duration: 30, notes: '', file: null });
      setShowAdd(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to log session');
    } finally {
      setIsUploading(false);
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Study Log</h1>
              <p className="text-zinc-500">Track what you've learned and upload your study materials.</p>
            </div>
            <Button onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? 'Cancel' : (
                <>
                  <Plus className="mr-2 w-4 h-4" />
                  Log Session
                </>
              )}
            </Button>
          </div>

          {showAdd && (
            <Card className="border-zinc-200 shadow-lg">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>New Study Session</CardTitle>
                  <CardDescription>What did you focus on today?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject / Topic</Label>
                      <Input 
                        id="subject" 
                        value={newSession.subject} 
                        onChange={e => setNewSession({...newSession, subject: e.target.value})}
                        placeholder="e.g. React Hooks, Organic Chemistry"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input 
                        id="duration" 
                        type="number"
                        value={newSession.duration} 
                        onChange={e => setNewSession({...newSession, duration: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes & Key Takeaways</Label>
                    <Textarea 
                      id="notes" 
                      value={newSession.notes} 
                      onChange={e => setNewSession({...newSession, notes: e.target.value})}
                      placeholder="Summarize what you studied..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">Upload Study Material (Image/PDF)</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        id="file" 
                        type="file" 
                        onChange={e => setNewSession({...newSession, file: e.target.files?.[0] || null})}
                        className="cursor-pointer"
                      />
                      {newSession.file && <span className="text-xs text-zinc-500 truncate max-w-[200px]">{newSession.file.name}</span>}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 w-4 h-4" />
                        Save Session
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.length > 0 ? (
              sessions.map(session => (
                <Card key={session.id} className="overflow-hidden border-zinc-200 hover:border-zinc-400 transition-all group">
                  {session.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-zinc-100">
                      <img 
                        src={session.imageUrl} 
                        alt={session.subject} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold line-clamp-1">{session.subject}</CardTitle>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{format(session.timestamp?.toDate() || new Date(), 'MMM dd')}</span>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" />
                      {session.duration} minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-zinc-600 line-clamp-3 italic">
                      "{session.notes || 'No notes provided.'}"
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    {session.imageUrl && (
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" asChild>
                        <a href={session.imageUrl} target="_blank" rel="noopener noreferrer">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          View Material
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900">No study sessions yet</h3>
                <p className="text-zinc-500 mt-1">Start logging your learning journey today.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-zinc-900 text-white border-none shadow-2xl sticky top-24">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm uppercase tracking-widest text-zinc-500">Focus Timer</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6">
              <div className="text-7xl font-mono font-bold tracking-tighter mb-8 tabular-nums">
                {formatTime(timer)}
              </div>
              <div className="flex justify-center gap-4">
                <Button 
                  size="icon-lg" 
                  variant="secondary" 
                  className="rounded-full w-16 h-16"
                  onClick={() => setIsActive(!isActive)}
                >
                  {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button 
                  size="icon-lg" 
                  variant="ghost" 
                  className="rounded-full w-16 h-16 text-zinc-400 hover:text-white"
                  onClick={() => {
                    setIsActive(false);
                    setTimer(25 * 60);
                  }}
                >
                  <RotateCcw className="w-8 h-8" />
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-0">
              <div className="w-full flex justify-between gap-2">
                <Button 
                  variant="ghost" 
                  className="flex-1 text-xs h-8 text-zinc-400 hover:text-white"
                  onClick={() => { setIsActive(false); setTimer(25 * 60); }}
                >
                  Pomodoro
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 text-xs h-8 text-zinc-400 hover:text-white"
                  onClick={() => { setIsActive(false); setTimer(5 * 60); }}
                >
                  Short Break
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 text-xs h-8 text-zinc-400 hover:text-white"
                  onClick={() => { setIsActive(false); setTimer(15 * 60); }}
                >
                  Long Break
                </Button>
              </div>
              <p className="text-[10px] text-zinc-600 text-center">
                Stay focused. Deep work yields the best results.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
