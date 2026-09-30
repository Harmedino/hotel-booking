import { Wifi, Coffee, BellRing, Mountain, Waves, Car, Dumbbell, Snowflake, Tv, Utensils, Sparkles, Check } from 'lucide-react';

const ICONS = {
  'Free WiFi': Wifi,
  'Free Breakfast': Coffee,
  'Room Service': BellRing,
  'Mountain View': Mountain,
  'Pool Access': Waves,
  Parking: Car,
  Gym: Dumbbell,
  'Air Conditioning': Snowflake,
  'Smart TV': Tv,
  Kitchen: Utensils,
  Spa: Sparkles,
};

export const AMENITY_OPTIONS = Object.keys(ICONS);
export const amenityIcon = (name) => ICONS[name] || Check;
