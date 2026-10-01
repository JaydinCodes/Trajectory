export type Area = { name: string; short: string; color: string; score: number; expected: number; detail: string; trend: "accelerating" | "steady" | "slowing"; };
export const areas: Area[] = [
  {name:"Faith", short:"FA", color:"#772d36", score:76, expected:65, detail:"12 / 25 reading days", trend:"accelerating"},
  {name:"Fitness", short:"FI", color:"#b85d32", score:69, expected:65, detail:"11 / 14 sessions", trend:"steady"},
  {name:"Odysseus", short:"OD", color:"#356c8e", score:61, expected:65, detail:"R4,200 / R8,000", trend:"steady"},
  {name:"Ledgerly", short:"LE", color:"#38745d", score:43, expected:65, detail:"MVP 43% complete", trend:"slowing"},
  {name:"Career", short:"CA", color:"#6b5685", score:74, expected:65, detail:"First month at GIBB", trend:"accelerating"},
  {name:"Coding", short:"CO", color:"#247b92", score:79, expected:65, detail:"64 / 100 problems", trend:"accelerating"},
  {name:"Finance", short:"FN", color:"#9c7928", score:55, expected:65, detail:"R6,480 saved", trend:"steady"},
  {name:"Personal", short:"PE", color:"#9a5865", score:62, expected:65, detail:"2 / 4 weekly reviews", trend:"steady"},
];
export const journal = "I finally understood how the ERP workflow fits together today. It made the newness of the job feel less intimidating.";
export const deepWork = [{name:"Odysseus", value:42, color:"#356c8e"},{name:"Ledgerly",value:28,color:"#38745d"},{name:"Career",value:17,color:"#6b5685"},{name:"Coding",value:13,color:"#247b92"}];
