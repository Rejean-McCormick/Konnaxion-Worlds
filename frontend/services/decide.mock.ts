// FILE: frontend/services/decide.mock.ts
// src/services/decide.mock.ts
import dayjs from 'dayjs';

export type VotingFormat = 'binary' | 'multiple' | 'scale';

export interface PublicTopic {
  id: string;
  categoryId: string;
  question: string;
  format: VotingFormat;
  /** For binary/multiple; ignored for scale */
  options?: string[];
  /** Optional labels for scale (e.g. ['None', 'A little', …]) */
  scaleLabels?: string[];
  turnout: number;      // %
  closesAt: string;     // ISO date-time
}

export interface Category {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Simulated network helpers                                         */
/* ------------------------------------------------------------------ */

const sleep = (ms = 350) => new Promise(r => setTimeout(r, ms));

/** Pretend “database” — extends easily */
const CATEGORIES: Category[] = [
  { id: 'gov',  name: 'Governance & Democracy' },
  { id: 'econ', name: 'Economy & Taxation' },
  { id: 'env',  name: 'Environment & Climate' },
];

const TOPICS: PublicTopic[] = [
  {
    id: 't1',
    categoryId: 'gov',
    question: 'Should Canada replace its first-past-the-post system with proportional representation?',
    format: 'binary',
    options: ['Yes', 'No'],
    turnout: 43,
    closesAt: dayjs().add(5, 'day').toISOString(),
  },
  {
    id: 't2',
    categoryId: 'econ',
    question: 'At what level should the national minimum wage be set?',
    format: 'multiple',
    options: ['<$18', '$18', '$20', '$22', 'No federal minimum'],
    turnout: 37,
    closesAt: dayjs().add(10, 'day').toISOString(),
  },
  {
    id: 't3',
    categoryId: 'env',
    question: 'How much should Canada raise the carbon tax beyond the current 2030 schedule?',
    format: 'scale',
    scaleLabels: ['None', 'A little', 'Average', 'Much', 'Very much'],
    turnout: 51,
    closesAt: dayjs().add(7, 'day').toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Fetch all public-ballot topics grouped by category */
export async function fetchPublicTopics(): Promise<{
  categories: Category[];
  topics: PublicTopic[];
}> {
  await sleep();               // simulate latency
  return { categories: CATEGORIES, topics: TOPICS };
}

/** Simulate persisting a vote */
export async function submitPublicVote(topicId: string, value: string | number) {
  console.info('vote saved', { topicId, value });
  await sleep(600);
  // In real life: POST /vote {topicId, value}
}

