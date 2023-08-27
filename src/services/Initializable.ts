import { Identifier } from "microinject";

export const Initializable: Identifier<Initializable> = "Initializable";
export interface Initializable {
  onInitialize(): void;
}
