// client/src/components/baby-size-display.tsx
import { getWeekData } from "@/lib/pregnancy-data";
import wombT1 from "@/asset/womb/womb-t1.png";
import wombT2 from "@/asset/womb/womb-t2.png";
import wombT3 from "@/asset/womb/womb-t3.png";

interface BabySizeDisplayProps {
  currentWeek: number;
}

function getWombImage(week: number) {
  if (week <= 13) return wombT1;      // 1st trimester
  if (week <= 27) return wombT2;      // 2nd trimester
  return wombT3;                      // 3rd trimester & beyond
}

export function BabySizeDisplay({ currentWeek }: BabySizeDisplayProps) {
  const weekData = getWeekData(currentWeek);
  const wombImage = getWombImage(currentWeek);

  return (
    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col md:flex-row items-center gap-8">
      {/* TEXT SIDE */}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-1">
          Your baby is the size of a
        </p>
        <h2 className="font-serif text-4xl font-bold text-primary mb-2">
          {weekData.size}
        </h2>

        <span className="inline-block text-xs bg-primary/10 text-primary px-3 py-1 rounded-full mb-3">
          ~{weekData.fruit}
        </span>

        <p className="text-muted-foreground leading-relaxed">
          {weekData.tip}
        </p>
      </div>

      {/* WOMB IMAGE SIDE */}
      <div className="flex justify-center items-center">
        <div className="w-60 h-60 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden shadow-inner">
          <img
            src={wombImage}
            alt={`Illustration of the womb around week ${currentWeek}`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
