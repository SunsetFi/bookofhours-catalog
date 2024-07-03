import { Container } from "microinject";
import { Observable } from "rxjs";

export interface SearchItemAction {
  icon: React.ReactNode;
  onClick(): void;
}

export interface SearchItemResult {
  iconUrl: string;
  label: string;
  secondaryText?: string;
  path: string;
  actions?: SearchItemAction[];
}

export type SearchProviderPipe = (
  query: Observable<string>,
  container: Container
) => Observable<SearchItemResult[]>;

export interface PageSearchItemResult extends Omit<SearchItemResult, "path"> {
  pathQuery: string;
}

export type PageSearchProviderPipe = (
  query: Observable<string>,
  container: Container
) => Observable<PageSearchItemResult[]>;
