import {
  Tv,
  Gamepad2,
  AudioLines,
  Speaker,
  Headphones,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Wind,
  WashingMachine,
  Refrigerator,
  Snowflake,
  Utensils,
  Wrench,
  Package,
  type LucideIcon,
} from "lucide-react";

export function iconForCategory(name: string): LucideIcon {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (n === "tv" || n === "mirror tv") return Tv;
  if (n === "console") return Gamepad2;
  if (n === "sound bar" || n === "soundbar") return AudioLines;
  if (n === "speaker") return Speaker;
  if (n === "headphones") return Headphones;
  if (n === "iphone") return Smartphone;
  if (n === "macbook pro") return Laptop;
  if (n === "ipad" || n === "ipad pro") return Tablet;
  if (n === "apple watch") return Watch;
  if (n === "mini split") return Wind;
  if (n === "washing machine") return WashingMachine;
  if (n === "drying machine") return Wind;
  if (n === "refrigerator") return Refrigerator;
  if (n === "freezer") return Snowflake;
  if (n === "dishwasher") return Utensils;
  if (n === "wall mount") return Wrench;
  return Package;
}
