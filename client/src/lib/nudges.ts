// client/src/lib/nudges.ts

export interface Nudge {
  id: string;
  message: string;
  category: "hydration" | "rest" | "movement" | "nutrition" | "selfcare" | "preparation" | "connection";
  forSymptoms?: string[];
  forMoods?: ("happy" | "neutral" | "sad")[];
}

export const NUDGES: Nudge[] = [
  { id: "sym-nausea", message: "Eating smaller, more frequent meals can help with nausea.", category: "nutrition", forSymptoms: ["Nausea"] },
  { id: "sym-fatigue1", message: "A short rest may help today. Even 15 minutes can recharge you.", category: "rest", forSymptoms: ["Fatigue"] },
  { id: "sym-fatigue2", message: "Fatigue is your body working hard. Be gentle with yourself.", category: "selfcare", forSymptoms: ["Fatigue"] },
  { id: "sym-headache", message: "Hydration check. Headaches often improve with water and rest.", category: "hydration", forSymptoms: ["Headache"] },
  { id: "sym-backpain", message: "Try some gentle stretches for your lower back when you can.", category: "movement", forSymptoms: ["Back pain"] },
  { id: "sym-cramps", message: "A warm compress and rest may ease those cramps.", category: "rest", forSymptoms: ["Cramps"] },
  { id: "sym-heartburn", message: "Smaller meals and staying upright after eating can ease heartburn.", category: "nutrition", forSymptoms: ["Heartburn"] },
  { id: "sym-swelling", message: "Try elevating your feet for a few minutes—it can ease swelling.", category: "rest", forSymptoms: ["Swelling"] },
  { id: "sym-insomnia", message: "Tonight, try going to bed 30 minutes earlier than usual.", category: "rest", forSymptoms: ["Insomnia"] },
  { id: "sym-mood", message: "Mood swings are normal. Be kind to yourself today.", category: "selfcare", forSymptoms: ["Mood swings"] },
  { id: "mood-sad1", message: "Send a quick message to someone who makes you smile.", category: "connection", forMoods: ["sad"] },
  { id: "mood-sad2", message: "Play a song you love. Music can shift your whole mood.", category: "selfcare", forMoods: ["sad"] },
  { id: "mood-sad3", message: "Ask for help with one thing today. You don't have to do it all alone.", category: "connection", forMoods: ["sad"] },
  { id: "mood-neutral", message: "A gentle 10-minute walk can boost your energy and mood.", category: "movement", forMoods: ["neutral"] },
  { id: "mood-happy", message: "Take a belly photo to capture this moment in your journey.", category: "preparation", forMoods: ["happy"] },
  { id: "gen-h1", message: "Have you had a glass of water recently? Your body is working hard.", category: "hydration" },
  { id: "gen-h2", message: "Keep a water bottle nearby—small sips throughout the day add up.", category: "hydration" },
  { id: "gen-r1", message: "If you can, take a moment to rest. You deserve it.", category: "rest" },
  { id: "gen-m1", message: "Stretch your legs and wiggle your toes—circulation matters.", category: "movement" },
  { id: "gen-m2", message: "If you've been sitting, stand up and take 5 slow deep breaths.", category: "movement" },
  { id: "gen-s1", message: "Take 3 slow, deep breaths. In through your nose, out through your mouth.", category: "selfcare" },
  { id: "gen-s2", message: "Write down one thing you're grateful for today.", category: "selfcare" },
  { id: "gen-c1", message: "Talk to your baby—they can hear your voice now.", category: "connection" },
  { id: "gen-p1", message: "Add one item to your hospital bag or baby prep list.", category: "preparation" },
];

export interface CheckinContext {
  mood?: "happy" | "neutral" | "sad" | null;
  symptoms?: string[];
}

export function getNudgeForCheckin(context: CheckinContext | null, date: Date = new Date()): Nudge {
  const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const pickFromArray = <T>(arr: T[]): T => {
    if (arr.length === 0) return arr[0];
    return arr[Math.abs(hash) % arr.length];
  };
  
  if (context) {
    if (context.symptoms && context.symptoms.length > 0) {
      const symptomNudges = NUDGES.filter(n => n.forSymptoms?.some(s => context.symptoms?.includes(s)));
      if (symptomNudges.length > 0) return pickFromArray(symptomNudges);
    }
    if (context.mood) {
      const moodNudges = NUDGES.filter(n => n.forMoods?.includes(context.mood!));
      if (moodNudges.length > 0) return pickFromArray(moodNudges);
    }
  }
  
  const generalNudges = NUDGES.filter(n => !n.forSymptoms && !n.forMoods);
  return pickFromArray(generalNudges);
}

export function getTodaysNudge(date: Date = new Date()): Nudge {
  return getNudgeForCheckin(null, date);
}

export function getNudgeCompletedKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `nudge_completed_${yyyy}-${mm}-${dd}`;
}

export function isNudgeCompleted(date: Date = new Date()): boolean {
  return localStorage.getItem(getNudgeCompletedKey(date)) === "true";
}

export function markNudgeCompleted(date: Date = new Date()): void {
  localStorage.setItem(getNudgeCompletedKey(date), "true");
}
