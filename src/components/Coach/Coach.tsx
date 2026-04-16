import { useState } from 'react';
import { User } from 'firebase/auth';
import { QUESTIONS } from '../../constants';
import { DailyEntry, QuestionId } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeDailyEntry } from '../../services/gemini';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface CoachProps {
  user: User;
  onComplete: () => void;
}

export default function Coach({ user, onComplete }: CoachProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<DailyEntry>>({
    userId: user.uid,
    date: new Date().toISOString().split('T')[0],
    habits: {
      exercise: false,
      focusedWork: false,
      healthyEating: false,
      goodSleep: false
    },
    priorities: ['', '', ''],
    gratitude: ['', '', '']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAnswer = (id: QuestionId, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setIsAnalyzing(true);
    try {
      // 1. Analyze with Gemini
      const analysis = await analyzeDailyEntry(answers as DailyEntry);
      
      // 2. Save to Firestore
      const entryData = {
        ...answers,
        analysis,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, 'entries'), entryData);
      
      toast.success('Daily entry saved and analyzed!');
      onComplete();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  const renderInput = () => {
    switch (currentQuestion.type) {
      case 'number':
        return (
          <div className="flex flex-col gap-4">
            <Input
              type="number"
              min={1}
              max={10}
              value={answers.mood || ''}
              onChange={(e) => updateAnswer('mood', parseInt(e.target.value))}
              placeholder={currentQuestion.placeholder}
              className="text-2xl h-16 text-center font-bold"
              autoFocus
            />
            <div className="flex justify-between text-xs text-zinc-400 px-2">
              <span>Rough day</span>
              <span>Amazing day</span>
            </div>
          </div>
        );
      case 'list':
        const listKey = currentQuestion.id as 'priorities' | 'gratitude';
        const list = (answers[listKey] as string[]) || ['', '', ''];
        return (
          <div className="flex flex-col gap-3">
            {list.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-zinc-400 font-mono text-sm">{index + 1}.</span>
                <Input
                  value={item}
                  onChange={(e) => {
                    const newList = [...list];
                    newList[index] = e.target.value;
                    updateAnswer(listKey, newList);
                  }}
                  placeholder={`Item ${index + 1}`}
                  className="h-12"
                  autoFocus={index === 0}
                />
              </div>
            ))}
          </div>
        );
      case 'multiline':
        return (
          <Textarea
            value={(answers[currentQuestion.id as keyof DailyEntry] as string) || ''}
            onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="min-h-[150px] text-lg resize-none"
            autoFocus
          />
        );
      case 'habits':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(answers.habits!).map((habit) => (
              <div 
                key={habit} 
                className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  answers.habits![habit as keyof typeof answers.habits] 
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                    : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                }`}
                onClick={() => {
                  const newHabits = { ...answers.habits! };
                  newHabits[habit as keyof typeof answers.habits] = !newHabits[habit as keyof typeof answers.habits];
                  updateAnswer('habits', newHabits);
                }}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  answers.habits![habit as keyof typeof answers.habits] 
                    ? 'bg-white border-white' 
                    : 'border-zinc-300'
                }`}>
                  {answers.habits![habit as keyof typeof answers.habits] && <CheckCircle2 className="w-4 h-4 text-zinc-900" />}
                </div>
                <Label className="text-base font-medium capitalize cursor-pointer">
                  {habit.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
              </div>
            ))}
          </div>
        );
      case 'text':
      default:
        return (
          <Input
            value={(answers[currentQuestion.id as keyof DailyEntry] as string) || ''}
            onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="h-14 text-lg"
            autoFocus
          />
        );
    }
  };

  const isCurrentAnswerValid = () => {
    const val = answers[currentQuestion.id as keyof DailyEntry];
    if (currentQuestion.type === 'number') return val !== undefined && (val as number) >= 1 && (val as number) <= 10;
    if (currentQuestion.type === 'list') return (val as string[]).every(item => item.trim().length > 0);
    if (currentQuestion.type === 'habits') return true;
    return typeof val === 'string' && val.trim().length > 0;
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto">
            <Loader2 className="w-24 h-24 text-zinc-900 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Send className="w-8 h-8 text-zinc-900" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Analyzing your day...</h2>
          <p className="text-zinc-500">
            I'm looking for patterns in your responses to help you improve tomorrow. 
            Just a moment.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
            Step {currentStep + 1} of {QUESTIONS.length}
          </span>
          <span className="text-sm font-bold text-zinc-900">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-zinc-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-8 pt-10">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-10">
              {renderInput()}
            </CardContent>
            <CardFooter className="flex justify-between bg-zinc-50 border-t border-zinc-100 p-6">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                disabled={currentStep === 0 || isSubmitting}
                className="text-zinc-500"
              >
                <ChevronLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!isCurrentAnswerValid() || isSubmitting}
                className="px-8 font-bold"
              >
                {currentStep === QUESTIONS.length - 1 ? (
                  <>
                    Finish Entry
                    <Send className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 text-center">
        <p className="text-xs text-zinc-400 italic">
          "Be concise but insightful. Be honest, not overly positive."
        </p>
      </div>
    </div>
  );
}
