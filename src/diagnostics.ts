import { create } from "rxjs-spy";
// Laggy as shit, don't enable in prod
let spy: ReturnType<typeof create>;
if (process.env.NODE_ENV === "development") {
  console.log("Creating spy");
  spy = create();
  spy.log("all-token-models");
  console.log("Done creating spy");
}
