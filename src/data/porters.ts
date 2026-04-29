import type { Porter } from "./types";

// Drop porter headshots into /public/porters/<filename> and reference them
// here. PNG or JPG works; aim for a roughly square crop, shoulders-up.
export const PORTERS: Porter[] = [
  {
    id: "sergio",
    name: "Sergio Carrillo",
    title: "Field Supervisor since 2020",
    photoUrl: "/porters/sergio.jpg",
  },
];
