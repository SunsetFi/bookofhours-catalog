import { BookOfHoursAPI } from "secrethistories-api";
import { Identifier } from "microinject";

export type API = BookOfHoursAPI;
export const API: Identifier<API> = "API";

export function APIFactory() {
  return new BookOfHoursAPI("http://localhost:8081");
}
