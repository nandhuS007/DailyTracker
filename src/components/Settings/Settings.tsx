import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, UserSettings } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Bell, Shield, User as UserIcon, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsProps {
  user: User;
}

export default function Settings({ user }: SettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    dailyReminders: false,
    reminderTime: '20:00'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          if (data.settings) {
            setSettings(data.settings);
          }
        } else {
          // Create initial profile
          const initialProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            settings: {
              dailyReminders: false,
              reminderTime: '20:00'
            }
          };
          await setDoc(docRef, initialProfile);
          setProfile(initialProfile);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.uid, user.email, user.displayName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        settings: settings
      });
      
      if (settings.dailyReminders) {
        // Request notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            toast.success('Notifications enabled!');
          } else {
            toast.error('Notification permission denied. Please enable it in your browser settings.');
          }
        }
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-zinc-500">Manage your profile and notification preferences.</p>
      </div>

      <div className="space-y-6">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-zinc-400" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Your basic account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={user.displayName || ''} disabled className="bg-zinc-50" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={user.email || ''} disabled className="bg-zinc-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-zinc-400" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Stay on track with daily reminders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="reminders" className="text-base">Daily Reminders</Label>
                <p className="text-sm text-zinc-500">Receive a notification to complete your habits.</p>
              </div>
              <Checkbox 
                id="reminders" 
                checked={settings.dailyReminders}
                onCheckedChange={(checked) => setSettings({...settings, dailyReminders: !!checked})}
              />
            </div>
            
            {settings.dailyReminders && (
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <Label htmlFor="time">Reminder Time</Label>
                <Input 
                  id="time" 
                  type="time" 
                  value={settings.reminderTime}
                  onChange={(e) => setSettings({...settings, reminderTime: e.target.value})}
                  className="w-32"
                />
                <p className="text-xs text-zinc-400">We'll remind you at this time every day.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-zinc-50 border-t border-zinc-100">
            <Button onClick={handleSave} disabled={saving} className="ml-auto">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-400" />
              <CardTitle>Privacy & Security</CardTitle>
            </div>
            <CardDescription>Your data is stored securely in Firestore.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">
              Only you have access to your daily entries, study logs, and habit data. 
              We use industry-standard encryption and security rules to protect your information.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
