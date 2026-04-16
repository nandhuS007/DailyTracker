import { Question } from "./types";

export const QUESTIONS: Question[] = [
  {
    id: 'mood',
    text: 'What is your mood today (1–10)?',
    type: 'number',
    placeholder: '1-10'
  },
  {
    id: 'priorities',
    text: 'What are your top 3 priorities today?',
    type: 'list',
    placeholder: 'Priority 1, Priority 2, Priority 3'
  },
  {
    id: 'accomplishments',
    text: 'What did you accomplish today?',
    type: 'multiline',
    placeholder: 'List your wins...'
  },
  {
    id: 'habits',
    text: 'Did you complete these habits?',
    type: 'habits'
  },
  {
    id: 'distraction',
    text: 'What distracted you the most today?',
    type: 'text',
    placeholder: 'Social media, meetings, etc.'
  },
  {
    id: 'learned',
    text: 'What is one thing you learned today?',
    type: 'text',
    placeholder: 'A new concept, a life lesson...'
  },
  {
    id: 'wentWell',
    text: 'What went well today?',
    type: 'multiline',
    placeholder: 'Positive moments...'
  },
  {
    id: 'improvement',
    text: 'What can you improve tomorrow?',
    type: 'multiline',
    placeholder: 'Be specific...'
  },
  {
    id: 'gratitude',
    text: 'What are 3 things you are grateful for?',
    type: 'list',
    placeholder: 'Gratitude 1, Gratitude 2, Gratitude 3'
  }
];
