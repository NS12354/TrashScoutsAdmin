import type { Guide } from "./types";

// Shared content shown on every property's Recycling Guide and HHW page.
// Markdown-lite: "## Heading" + "- bullet". Edit this file to update.

export const WASTE_GUIDE: Guide = {
  title: "Waste & Recycling Guide",
  content: `## Trash (Gray/Black Bin)
General household garbage: food-soiled paper, broken dishes, diapers, plastic wrap, plastic bags, styrofoam.

## Recycling (Blue Bin)
Rinsed clean: cans, bottles, jars, cardboard, paper, rigid plastics #1, #2, #5.
Do NOT include: plastic bags, food-soiled containers, wet paper.

## Organics (Green Bin)
Food scraps, food-soiled paper, yard trimmings. NO plastic, NO pet waste.

## Quick Tips
- When in doubt, throw it out (in trash, not recycling).
- Empty and rinse containers before recycling.
- Break down large cardboard.`,
};

export const HHW_GENERAL_GUIDE: Guide = {
  title: "Household Hazardous Waste — General Guide",
  content: `## What is Hazardous Waste?
Items containing chemicals, heavy metals, or other materials that can harm people or the environment if dumped in regular trash.

## Common Examples
- Batteries (especially lithium-ion / rechargeable)
- Paint, stains, solvents
- Cleaning chemicals, pool chemicals
- Motor oil, antifreeze, fuel
- Electronics (e-waste): TVs, monitors, computers, phones
- Light bulbs (CFLs, fluorescent tubes)
- Medications & sharps
- Propane / pressurized canisters

## Why It Matters
HHW in regular trash can leak in landfills, spark fires in trucks, and contaminate recycling. Your local jurisdiction almost always offers a free or low-cost drop-off.

## Safe Handling
- Keep items in their original container when possible.
- Never mix chemicals.
- Store away from heat until disposal.
- Tape battery terminals before transport.`,
};
