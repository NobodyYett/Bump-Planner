// client/src/lib/pregnancy-data.ts

export interface WeekData {
  week: number;
  size: string; // "Poppy seed", "Blueberry", etc.
  fruit: string; // Using generic terms or specific fruits
  tip: string;
  trimester: 1 | 2 | 3;
}

export const pregnancyData: WeekData[] = Array.from({ length: 42 }, (_, i) => {
  const week = i + 1;
  let trimester: 1 | 2 | 3 = 1;
  if (week > 13) trimester = 2;
  if (week > 27) trimester = 3;

  let size = "Microscopic";
  let fruit = "Speck of Dust";
  let tip = "Take your prenatal vitamins daily!";

  if (week === 4) { size = "Poppy Seed"; fruit = "Poppy Seed"; tip = "You might not feel different yet, but your baby is settling in!"; }
  else if (week === 5) { size = "Apple Seed"; fruit = "Apple Seed"; tip = "Fatigue is common now. Listen to your body and rest."; }
  else if (week === 6) { size = "Sweet Pea"; fruit = "Sweet Pea"; tip = "Morning sickness might start. Ginger tea can help!"; }
  else if (week === 7) { size = "Blueberry"; fruit = "Blueberry"; tip = "Your baby's heart is beating about 150 times a minute."; }
  else if (week === 8) { size = "Raspberry"; fruit = "Raspberry"; tip = "Baby is moving a lot, though you can't feel it yet."; }
  else if (week === 9) { size = "Cherry"; fruit = "Cherry"; tip = "Time to think about booking your first prenatal appointment."; }
  else if (week === 10) { size = "Strawberry"; fruit = "Strawberry"; tip = "Your baby's vital organs are fully formed."; }
  else if (week === 11) { size = "Lime"; fruit = "Lime"; tip = "You might be feeling a bit more energetic soon."; }
  else if (week === 12) { size = "Plum"; fruit = "Plum"; tip = "End of the first trimester is near! Risk of miscarriage drops significantly."; }
  else if (week === 13) { size = "Lemon"; fruit = "Lemon"; tip = "Welcome to the second trimester! The 'golden period'."; }
  else if (week === 14) { size = "Orange"; fruit = "Orange"; tip = "You might start showing a little bump soon."; }
  else if (week === 15) { size = "Pear"; fruit = "Pear"; tip = "Your baby can sense light now."; }
  else if (week === 16) { size = "Avocado"; fruit = "Avocado"; tip = "You might feel the first 'flutters' of movement (quickening)."; }
  else if (week === 17) { size = "Turnip"; fruit = "Turnip"; tip = "Baby is practicing swallowing and sucking."; }
  else if (week === 18) { size = "Bell Pepper"; fruit = "Bell Pepper"; tip = "Ears are in place—talk to your baby!"; }
  else if (week === 19) { size = "Mango"; fruit = "Mango"; tip = "A protective coating called vernix caseosa is forming on baby's skin."; }
  else if (week === 20) { size = "Banana"; fruit = "Banana"; tip = "Halfway there! Time for the anatomy scan ultrasound."; }
  else if (week === 21) { size = "Carrot"; fruit = "Carrot"; tip = "Baby's eyebrows and eyelids are fully formed."; }
  else if (week === 22) { size = "Spaghetti Squash"; fruit = "Spaghetti Squash"; tip = "Baby is developing a sleep-wake cycle."; }
  else if (week === 23) { size = "Large Mango"; fruit = "Large Mango"; tip = "Baby can hear loud noises from the outside world."; }
  else if (week === 24) { size = "Corn on the Cob"; fruit = "Ear of Corn"; tip = "Viability milestone! Baby has a chance of survival if born now."; }
  else if (week === 25) { size = "Rutabaga"; fruit = "Rutabaga"; tip = "Baby is adding baby fat to smooth out wrinkled skin."; }
  else if (week === 26) { size = "Scallion"; fruit = "Scallion"; tip = "Baby's eyes are opening!"; }
  else if (week === 27) { size = "Cauliflower"; fruit = "Cauliflower"; tip = "Welcome to the third trimester! Final stretch."; }
  else if (week === 28) { size = "Eggplant"; fruit = "Eggplant"; tip = "Baby can blink and dream."; }
  else if (week === 29) { size = "Butternut Squash"; fruit = "Butternut Squash"; tip = "Kick counts: Pay attention to your baby's movement patterns."; }
  else if (week === 30) { size = "Cabbage"; fruit = "Cabbage"; tip = "Brain surface is getting more complex."; }
  else if (week === 31) { size = "Coconut"; fruit = "Coconut"; tip = "Baby can turn their head from side to side."; }
  else if (week === 32) { size = "Kale"; fruit = "Bunch of Kale"; tip = "Baby is practicing breathing movements."; }
  else if (week === 33) { size = "Pineapple"; fruit = "Pineapple"; tip = "Immune system is developing."; }
  else if (week === 34) { size = "Cantaloupe"; fruit = "Cantaloupe"; tip = "Baby's fingernails have reached the fingertips."; }
  else if (week === 35) { size = "Honeydew Melon"; fruit = "Honeydew"; tip = "Baby is gaining weight rapidly now."; }
  else if (week === 36) { size = "Romaine Lettuce"; fruit = "Head of Lettuce"; tip = "Baby is dropping lower into the pelvis (engaging)."; }
  else if (week === 37) { size = "Swiss Chard"; fruit = "Bunch of Swiss Chard"; tip = "Considered 'early term'. Pack your hospital bag!"; }
  else if (week === 38) { size = "Leek"; fruit = "Leek"; tip = "Baby is ready to greet the world any day now."; }
  else if (week === 39) { size = "Watermelon"; fruit = "Watermelon"; tip = "Don't stray too far from home/hospital."; }
  else if (week === 40) { size = "Pumpkin"; fruit = "Pumpkin"; tip = "Happy Due Date! Don't worry if baby is late."; }
  else if (week > 40) { size = "Jackfruit"; fruit = "Jackfruit"; tip = "Overdue! Extra monitoring might be needed."; }

  return { week, size, fruit, tip, trimester };
});

export const getWeekData = (week: number) =>
  pregnancyData.find((d) => d.week === week) || pregnancyData[0];

/**
 * Mom-focused weekly wisdom
 * (grouped by ranges so we don't need 40 separate lines)
 */
export const getMomTip = (week: number): string => {
  if (week <= 4) {
    return "You might feel totally normal or a little 'off'. Trust your instincts and rest when you can.";
  } else if (week <= 8) {
    return "Nausea, fatigue, sore breasts—it's a lot. Small snacks, water, and grace for yourself go a long way.";
  } else if (week <= 12) {
    return "If you're feeling emotional or moody, you're not alone. Hormones are doing their thing—be gentle with yourself.";
  } else if (week <= 16) {
    return "Energy might start creeping back. If you feel up to it, light movement like walking can boost your mood.";
  } else if (week <= 20) {
    return "This is a great time to start routines that make you feel grounded—stretching, journaling, or a nightly wind-down ritual.";
  } else if (week <= 24) {
    return "As your body changes, supportive bras, belly bands, and comfy clothes can make everyday life feel much easier.";
  } else if (week <= 28) {
    return "Sleep might be getting trickier. Experiment with pillows between your knees and behind your back for better support.";
  } else if (week <= 32) {
    return "You might notice more back aches or heaviness. Slow down where you can, and don't be afraid to ask for help with chores or lifting.";
  } else if (week <= 36) {
    return "It's normal to feel a mix of excitement and worry. Talking through your birth preferences with your provider can give you more confidence.";
  } else if (week <= 40) {
    return "You may feel done and over it—physically and emotionally. Short walks, warm showers, and small moments of joy can help the days feel lighter.";
  } else {
    return "If you're past your due date, every day can feel like a year. Try to be kind to yourself, keep resting, and lean on your support system.";
  }
};
