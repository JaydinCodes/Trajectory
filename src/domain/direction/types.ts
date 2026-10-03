export type DirectionStatus = "active" | "archived" | "paused";
export type HorizonType = "quarter" | "year" | "custom";

export type LifeDirection = {
  id: number;
  area: string;
  statement: string;
  why: string | null;
  status: DirectionStatus;
  createdAt: string;
  updatedAt: string;
};

export type DirectionVersion = {
  id: number;
  directionId: number;
  statement: string;
  why: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
};

export type Horizon = {
  id: number;
  directionId: number;
  name: string;
  horizonType: HorizonType;
  startDate: string | null;
  endDate: string | null;
  statement: string;
  status: DirectionStatus;
  outcomes: HorizonOutcome[];
};

export type HorizonOutcome = { id: number; horizonId: number; statement: string; position: number };

export type DirectionLink = {
  directionId: number | null;
  horizonId: number | null;
};

export type DirectionOverview = {
  directions: Array<LifeDirection & {
    horizons: Horizon[];
    currentHorizon?: Horizon;
    currentSeason?: { id: number; name: string; goals: Array<{ id: number; title: string }> };
    linkedGoalCount: number;
    inactiveSeasonCount: number;
  }>;
  coverage: Array<{ area: string; directionId: number | null; status: "defined" | "none" }>;
  alignment: { totalGoals: number; connected: Array<{ directionId: number; area: string; goalCount: number }>; standalone: Array<{ id: number; title: string; area: string }> };
};
