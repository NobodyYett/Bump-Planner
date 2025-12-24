import { getWeekData } from "@/lib/pregnancy-data";
// FIX: Changed 'assets' to 'asset' to match your file tree screenshot
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
  // Safe fallback if data is missing
  const weekData = getWeekData(currentWeek) || { size: "Growing", fruit: "Baby", tip: "Your baby is growing every day!" };
  const wombImage = getWombImage(currentWeek);

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-8">
      {/* TEXT SIDE */}
      <div className="flex-1 text-center md:text-left">
        <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wide">
          Your baby is the size of a
        </p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2">
          {weekData.size}
        </h2>

        <span className="inline-block text-xs bg-primary/10 text-primary px-3 py-1 rounded-full mb-3 font-medium">
          ~{weekData.fruit}
        </span>

        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
          {weekData.tip}
        </p>
      </div>

      {/* WOMB IMAGE SIDE */}
      <div className="flex justify-center items-center flex-shrink-0">
        {/* Container: w-48 (mobile) -> w-60 (desktop) */}
        <div className="w- h-48 md:w-60 md:h-60 rounded-full bg-primary/5 border border-primary/100 flex items-center justify-center overflow-hidden shadow-inner">
          <img
            src={wombImage}
            alt={`Illustration of the womb around week ${currentWeek}`}
            // FIX: object-contain ensures the full image is visible without cropping
            className="w-3/4 h-3/4 object-contain" 
          />
        </div>
      </div>
    </div>
  );
}