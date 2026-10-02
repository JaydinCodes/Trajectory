import { describe, expect, it } from "vitest";
import { calculateAreaScore, calculateGoalProgress, calculateGoalTrajectory, calculateOverallScore, calculateSeasonProgress, calculateTrajectoryStatus } from "./index";
import type { Goal, Season } from "./types";

const october:Season={name:"October",theme:"Execution",start_date:"2026-10-01",end_date:"2026-10-31"};
const derived:Goal={id:1,area:"Coding",title:"Solve 100 DSA problems",goal_type:"count",target:100,current_value:999,weight:2,deadline:"2026-10-31",status:"active",metric_key:"dsa_problems",tracking_mode:"derived",season_id:null};
describe("authoritative trajectory engine",()=>{
 it("uses season dates instead of a fixed month length",()=>{expect(calculateSeasonProgress({name:"Sprint",theme:"",start_date:"2026-02-20",end_date:"2026-03-05"},"2026-03-01")).toEqual({elapsedDays:10,totalDays:14});});
 it("compares actual progress with expected pace",()=>{const goal=calculateGoalTrajectory(derived,october,"2026-10-01",5);expect(goal.actualPercentage).toBe(5);expect(goal.expectedPercentage).toBeCloseTo(3.23);expect(goal.trajectoryStatus).toBe("on_track");});
 it("uses metric evidence for derived goals and manual values for manual goals",()=>{expect(calculateGoalTrajectory(derived,october,"2026-10-10",5).current).toBe(5);expect(calculateGoalTrajectory({...derived,tracking_mode:"manual",current_value:7,metric_key:null},october,"2026-10-10",99).current).toBe(7);});
 it("measures a carried manual goal from its explicit new-season baseline",()=>{const carried={...derived,tracking_mode:"manual" as const,metric_key:null,current_value:82,target:100,baseline_value:82};expect(calculateGoalTrajectory(carried,october,"2026-10-10").actualPercentage).toBe(0);expect(calculateGoalTrajectory({...carried,current_value:91},october,"2026-10-10").actualPercentage).toBe(50);expect(calculateGoalTrajectory({...carried,current_value:100},october,"2026-10-10").actualPercentage).toBe(100);});
 it("handles zero, negative, and exceeded values",()=>{expect(calculateGoalProgress(5,0)).toBe(0);expect(calculateGoalProgress(-5,10)).toBe(0);expect(calculateGoalProgress(15,10)).toBe(100);expect(calculateTrajectoryStatus(100,20)).toBe("completed");});
 it("weights area and overall scores",()=>{expect(calculateAreaScore([{actualPercentage:50,weight:1},{actualPercentage:100,weight:3}])).toBe(87.5);expect(calculateOverallScore([{score:80,weight:1},{score:40,weight:3}])).toBe(50);});
});
