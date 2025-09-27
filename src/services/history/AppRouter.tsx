import React from "react";
import { Router } from "react-router";

import { useHistory } from "./hooks";

export interface AppRouterProps {
  children: React.ReactNode;
}
const AppRouter = ({ children }: AppRouterProps) => {
  const history = useHistory();
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
      future={{ v7_relativeSplatPath: true }}
    />
  );
};

export default AppRouter;
