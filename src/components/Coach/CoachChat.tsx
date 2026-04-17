import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { DailyEntry } from '@/types';
import { getCoachAdvice } from '@/services/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Brain, Send, Loader2, User as UserIcon, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CoachChatProps {
  user: User;
}

interface Message {
  role: 'user' | 'coach';
  text: string;
}

export default function CoachChat({ user }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'coach', text: "Hi! I've been reviewing your recent entries. How can I help you stay accountable today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<DailyEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'entries'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as DailyEntry);
      setHistory(docs);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const advice = await getCoachAdvice(history, userMsg);
      setMessages(prev => [...prev, { role: 'coach', text: advice }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'coach', text: "Sorry, I'm having trouble connecting right now. Let's try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-zinc-200 shadow-xl h-[calc(100vh-200px)] flex flex-col overflow-hidden">
      <CardHeader className="bg-zinc-900 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Coach Chat</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">AI-powered accountability partner</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 border border-zinc-100 shrink-0">
                    {msg.role === 'coach' ? (
                      <AvatarFallback className="bg-zinc-900 text-white"><Brain className="w-4 h-4" /></AvatarFallback>
                    ) : (
                      <AvatarImage src={user.photoURL || ''} />
                    )}
                    <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-zinc-100 text-zinc-900 rounded-tr-none' 
                      : 'bg-zinc-50 border border-zinc-100 text-zinc-800 rounded-tl-none shadow-sm'
                  }`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-center text-zinc-400 text-xs font-medium italic">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Coach is thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 bg-zinc-50 border-t border-zinc-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex w-full gap-2"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for advice, share a struggle..."
            className="flex-1 bg-white"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
