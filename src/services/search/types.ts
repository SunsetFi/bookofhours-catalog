import { Container } from "microinject";
import { Observable } from "rxjs";

export type SearchQuery = CompositeSearchQuery | TerminalSearchQuery;

export type CompositeSearchQuery = AndSearchQuery;

export interface AndSearchQuery {
  type: "and";
  queries: SearchQuery[];
}

export type TerminalSearchQuery = TextSearchQuery | AspectSearchQuery;

export interface TextSearchQuery {
  type: "text";
  text: string;
}

export interface AspectSearchQuery {
  type: "aspect";
  aspect: string;
}

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
  query: Observable<SearchQuery>,
  container: Container
) => Observable<readonly SearchItemResult[]>;

export interface PageSearchItemResult extends Omit<SearchItemResult, "path"> {
  pathQuery: string;
}

export type PageSearchProviderPipe = (
  query: Observable<SearchQuery>,
  container: Container
) => Observable<readonly PageSearchItemResult[]>;
