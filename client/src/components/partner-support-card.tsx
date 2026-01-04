// client/src/components/partner-support-card.tsx

import { Heart, Coffee, Car, ShoppingBag, Moon, Utensils, Bath, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerSupportCardProps {
  currentWeek: number;
  trimester: 1 | 2 | 3;
  momName?: string | null;
}

interface SupportTip {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function getTipsForWeek(week: number, trimester: 1 | 2 | 3, momName?: string | null): SupportTip[] {
  const name = momName || "her";
  
  // First trimester tips (weeks 1-13)
  if (trimester === 1) {
    return [
      {
        icon: <Utensils className="w-4 h-4" />,
        title: "Help with meals",
        description: `Nausea can make cooking tough. Offer to prepare bland, easy foods or pick up ${name}'s favorites.`,
      },
      {
        icon: <Coffee className="w-4 h-4" />,
        title: "Be patient with fatigue",
        description: `Growing a baby is exhausting. Let ${name} rest without guilt — even early bedtimes are normal.`,
      },
      {
        icon: <MessageCircle className="w-4 h-4" />,
        title: "Listen without fixing",
        description: `Emotions can be all over the place. Sometimes ${name} just needs you to listen, not solve.`,
      },
    ];
  }
  
  // Second trimester tips (weeks 14-27)
  if (trimester === 2) {
    return [
      {
        icon: <ShoppingBag className="w-4 h-4" />,
        title: "Help prepare the nursery",
        description: `This is a great time to start setting things up together. Offer to assemble furniture or paint.`,
      },
      {
        icon: <Car className="w-4 h-4" />,
        title: "Attend appointments",
        description: `If you can, join prenatal visits. It means a lot and helps you both feel connected to the journey.`,
      },
      {
        icon: <Heart className="w-4 h-4" />,
        title: "Compliment her",
        description: `Body changes can feel strange. Remind ${name} how amazing she looks and what she's accomplishing.`,
      },
    ];
  }
  
  // Third trimester tips (weeks 28-40)
  return [
    {
      icon: <Bath className="w-4 h-4" />,
      title: "Help with comfort",
      description: `Back rubs, foot massages, or running a warm bath can make a big difference right now.`,
      },
    {
      icon: <Moon className="w-4 h-4" />,
      title: "Support sleep",
      description: `Sleep gets harder. Help adjust pillows, keep the room cool, and be understanding of restless nights.`,
    },
    {
      icon: <ShoppingBag className="w-4 h-4" />,
      title: "Pack the hospital bag",
      description: `Make sure the bag is ready and you know the fastest route to the hospital or birth center.`,
    },
  ];
}

export function PartnerSupportCard({ currentWeek, trimester, momName }: PartnerSupportCardProps) {
  const tips = getTipsForWeek(currentWeek, trimester, momName);
  
  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* You're Here header */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 p-6 text-center border-b border-border">
        <div className="w-14 h-14 rounded-full bg-white dark:bg-card border border-border flex items-center justify-center mx-auto mb-3 shadow-sm">
          <span className="text-2xl">💙</span>
        </div>
        <h2 className="font-serif text-xl font-semibold mb-1">You're Here</h2>
        <p className="text-sm text-muted-foreground">
          Being present and involved means the world
        </p>
      </div>

      {/* Support tips section */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-medium">How You Can Support This Week</h3>
        </div>

        {/* Tips */}
        <div className="space-y-3">
          {tips.map((tip, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                "bg-muted/50 border border-border/50"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
                {tip.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Encouragement footer */}
        <p className="text-xs text-muted-foreground text-center mt-5 pt-4 border-t border-border">
          Check back anytime to see updates and find ways to help. 💙
        </p>
      </div>
    </section>
  );
}