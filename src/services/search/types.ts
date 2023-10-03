import { Container } from "microinject";
import { Observable } from "rxjs";

export interface PageSearchItemResult {
  iconUrl: string;
  label: string;
  pathQuery: string;
}

export type PageSearchProviderPipe = (
  query: Observable<string>,
  container: Container
) => Observable<PageSearchItemResult[]>;

export interface SearchItemResult
  extends Omit<PageSearchItemResult, "pathQuery"> {
  pathQuery?: string;
  path: string;
}

export type SearchProviderPipe = (
  query: Observable<string>,
  container: Container
) => Observable<SearchItemResult[]>;
