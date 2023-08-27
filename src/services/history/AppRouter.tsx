import React from "react";
import { Router } from "react-router";

import { useDIDependency } from "@/container";

import { History } from "./History";

export interface AppRouterProps {
  children: React.ReactNode;
}
const AppRouter = ({ children }: AppRouterProps) => {
  const history = useDIDependency(History);
  let [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
};

export default AppRouter;
