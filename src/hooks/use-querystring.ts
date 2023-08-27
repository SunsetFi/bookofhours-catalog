import { useLocation } from "react-router";

export function useQueryString(query: string): string | null {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return params.get(query);
}
