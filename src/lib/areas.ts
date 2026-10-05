export const lifeAreas = ["Faith", "Fitness", "Career", "Coding", "Odysseus", "Ledgerly", "Finance", "Personal"] as const;
export type LifeArea = typeof lifeAreas[number];

export const isLifeArea = (value: string): value is LifeArea => lifeAreas.includes(value as LifeArea);
