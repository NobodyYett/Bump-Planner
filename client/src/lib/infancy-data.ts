// client/src/lib/infancy-data.ts
// Weekly insights and tips for infancy (weeks 1-12)

export interface InfantWeekData {
  week: number;
  title: string;
  babyInsight: string;
  parentTip: string;
  milestone?: string;
}

export const infantData: InfantWeekData[] = [
  {
    week: 1,
    title: "Welcome to the World",
    babyInsight: "Your newborn sleeps 16-17 hours a day in short bursts. They can see about 8-12 inches away — just enough to focus on your face during feeding.",
    parentTip: "This week is about rest and recovery. Sleep when baby sleeps. Accept help. You're not expected to have it all figured out.",
    milestone: "First skin-to-skin contact strengthens your bond",
  },
  {
    week: 2,
    title: "Finding Your Rhythm",
    babyInsight: "Baby is starting to recognize your voice and smell. They may be more alert for short periods between sleep cycles.",
    parentTip: "Cluster feeding is normal and helps establish your milk supply. It's exhausting, but temporary. You're doing great.",
  },
  {
    week: 3,
    title: "Growing Stronger",
    babyInsight: "Your baby's neck muscles are getting stronger. During tummy time, they might briefly lift their head.",
    parentTip: "If you're feeling overwhelmed, that's completely normal. The 'baby blues' often peak this week. Talk to someone you trust.",
    milestone: "Brief head lifting during tummy time",
  },
  {
    week: 4,
    title: "One Month Already",
    babyInsight: "Baby can focus on faces better now and may start tracking moving objects with their eyes. First social smiles might appear!",
    parentTip: "You've made it through the first month. That's huge. Take a moment to acknowledge how much you've learned.",
    milestone: "First real smiles (not just gas!)",
  },
  {
    week: 5,
    title: "Becoming More Social",
    babyInsight: "Your baby is becoming more expressive — cooing, gurgling, and making eye contact. They're learning to communicate with you.",
    parentTip: "Talk to your baby often. Narrate your day. They're absorbing language even though they can't respond yet.",
  },
  {
    week: 6,
    title: "Growth Spurt Time",
    babyInsight: "Many babies hit a growth spurt around now. Expect more frequent feeding and possibly fussier evenings.",
    parentTip: "Growth spurts are temporary. Extra feeding now doesn't mean your supply is low — baby is just working hard to grow.",
    milestone: "First pediatrician checkup and vaccinations",
  },
  {
    week: 7,
    title: "Discovering Hands",
    babyInsight: "Baby is starting to discover their hands! They might stare at them or accidentally bring them to their mouth.",
    parentTip: "If you haven't already, this is a good time to start a simple bedtime routine. Consistency helps everyone sleep better.",
  },
  {
    week: 8,
    title: "Two Months Strong",
    babyInsight: "Your baby's personality is emerging. They may have clear preferences for certain positions, sounds, or activities.",
    parentTip: "You know your baby better than anyone. Trust your instincts over generic advice.",
    milestone: "More controlled head movements",
  },
  {
    week: 9,
    title: "Finding Their Voice",
    babyInsight: "Baby's coos are becoming more varied. They're experimenting with different sounds and may 'talk' back when you speak to them.",
    parentTip: "Respond to baby's sounds like a conversation. This back-and-forth is the foundation of language development.",
  },
  {
    week: 10,
    title: "Stronger Every Day",
    babyInsight: "During tummy time, baby can hold their head up at a 45-degree angle. Their movements are becoming more purposeful.",
    parentTip: "If you're returning to work soon, start preparing gradually. Practice your new routine before the actual day.",
    milestone: "Holds head at 45° during tummy time",
  },
  {
    week: 11,
    title: "Reaching Out",
    babyInsight: "Baby may start batting at toys or reaching toward interesting objects. Their hand-eye coordination is developing rapidly.",
    parentTip: "Simple toys with high contrast colors are perfect right now. You don't need expensive gadgets — everyday objects fascinate babies.",
  },
  {
    week: 12,
    title: "Three Months!",
    babyInsight: "Your baby can hold their head steady, track objects smoothly, and may even laugh out loud. They recognize familiar faces and show excitement.",
    parentTip: "The 'fourth trimester' is complete. Many parents find things get easier from here. You've built a foundation together.",
    milestone: "First laughs and steady head control",
  },
];

// Get data for a specific week (1-12+)
export function getInfantWeekData(week: number): InfantWeekData {
  if (week < 1) {
    return infantData[0];
  }
  if (week > 12) {
    // Beyond 12 weeks, return a generic message
    return {
      week,
      title: `Week ${week}`,
      babyInsight: "Your baby continues to grow and develop new skills every day. Each week brings new discoveries and connections.",
      parentTip: "You've come so far. Keep following your baby's lead and trusting your instincts.",
    };
  }
  return infantData[week - 1];
}

// Mom-focused tips for infancy (similar to pregnancy getMomTip)
export function getInfancyMomTip(week: number): string {
  if (week <= 2) {
    return "Your body is still healing. Rest is not optional — it's essential. Let others handle everything except feeding and bonding.";
  } else if (week <= 4) {
    return "The sleep deprivation is real. Remember: this intensity is temporary. Your baby's sleep will consolidate over time.";
  } else if (week <= 6) {
    return "If you're breastfeeding, your supply is likely well-established now. If you're formula feeding, you've found your rhythm. Both are great.";
  } else if (week <= 8) {
    return "You might be feeling more confident now. Trust that feeling — you've learned so much about your baby in just two months.";
  } else if (week <= 10) {
    return "It's okay to miss your old life sometimes. You can love your baby deeply and still grieve the freedom you had before.";
  } else if (week <= 12) {
    return "The fourth trimester is ending. Many parents find a new normal emerging. You're not just surviving anymore — you're thriving.";
  } else {
    return "Every stage has its challenges and joys. You've navigated the hardest part of newborn life. The road ahead is filled with milestones.";
  }
}

// Partner-focused tips for infancy
export function getInfancyPartnerTip(week: number): string {
  if (week <= 2) {
    return "Your primary job right now: protect mom's rest. Handle visitors, meals, and household tasks so she can focus on recovery and baby.";
  } else if (week <= 4) {
    return "Take a night feeding if possible — even one uninterrupted stretch of sleep makes a huge difference for a recovering parent.";
  } else if (week <= 6) {
    return "Check in emotionally, not just logistically. Ask how she's really doing. Listen without trying to fix everything.";
  } else if (week <= 8) {
    return "Find your own ways to bond with baby. Bath time, walks, or just holding them while they sleep — these moments matter.";
  } else if (week <= 10) {
    return "Plan something small and special for your partner — even an uninterrupted shower or a favorite treat can mean the world.";
  } else if (week <= 12) {
    return "You're past the hardest part together. Make time to connect as partners, even if it's just 10 minutes of conversation.";
  } else {
    return "Keep being present. Your involvement now shapes your relationship with your child for years to come.";
  }
}