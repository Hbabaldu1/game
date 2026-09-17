export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'score' | 'combo' | 'career' | 'garage';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_drive',
    title: 'Lagos Driver',
    description: 'Complete your maiden voyage on the expressway.',
    iconName: 'Car',
    category: 'career'
  },
  {
    id: 'first_close_shave',
    title: 'Smooth Operator',
    description: 'Perform your first razor-sharp Near-Miss Close Shave.',
    iconName: 'Zap',
    category: 'combo'
  },
  {
    id: 'close_shave_10',
    title: 'Traffic Weaver',
    description: 'Execute 10 cumulative Close Shaves across your career.',
    iconName: 'Flame',
    category: 'combo'
  },
  {
    id: 'combo_5x',
    title: 'High Voltage',
    description: 'Chain 5 consecutive Close Shaves before timer resets.',
    iconName: 'Sparkles',
    category: 'combo'
  },
  {
    id: 'combo_10x',
    title: 'Lagos Ghost',
    description: 'Reach the maximum 10x Combo multiplier!',
    iconName: 'Award',
    category: 'combo'
  },
  {
    id: 'score_1000',
    title: 'Third Mainland Commuter',
    description: 'Score 1,000 points in a single run.',
    iconName: 'Compass',
    category: 'score'
  },
  {
    id: 'score_5000',
    title: 'Expressway Legend',
    description: 'Score 5,000 points in a single run.',
    iconName: 'Trophy',
    category: 'score'
  },
  {
    id: 'kobo_collector_100',
    title: 'Fare Collector',
    description: 'Accumulate a balance of 100 Kobo.',
    iconName: 'Coins',
    category: 'career'
  },
  {
    id: 'unlock_first_vehicle',
    title: 'Garage Upgrade',
    description: 'Unlock your first secondary vehicle from the Garage.',
    iconName: 'Key',
    category: 'garage'
  },
  {
    id: 'daily_challenger',
    title: 'Daily Hustle',
    description: 'Complete a Daily Challenge run.',
    iconName: 'CalendarCheck',
    category: 'career'
  }
];
