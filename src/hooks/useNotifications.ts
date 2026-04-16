import { useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function useNotifications(user: User | null) {
  const lastNotifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        const settings = data.settings;

        if (settings?.dailyReminders) {
          const checkReminders = () => {
            const now = new Date();
            const currentTime = format(now, 'HH:mm');
            const today = format(now, 'yyyy-MM-dd');

            if (currentTime === settings.reminderTime && lastNotifiedRef.current !== today) {
              lastNotifiedRef.current = today;
              
              const title = 'Daily Accountability Reminder';
              const options = {
                body: "Don't forget to complete your habits and study log for today!",
                icon: '/favicon.ico'
              };

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, options);
              } else {
                toast(title, {
                  description: options.body,
                  duration: 10000,
                });
              }
            }
          };

          const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
          return () => clearInterval(interval);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);
}
