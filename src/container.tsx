import React from "react";
import {
  composeModules,
  Container,
  Identifier,
  Newable,
  ParameterRecord,
} from "microinject";

import servicesModule from "./services/module.js";
import { Initializable } from "./services/Initializable.js";

interface HotData {
  container?: Container;
}

const hot = import.meta.hot;
const prev = (hot?.data as HotData)?.container;
const container = prev ?? createContainer();

export default container;

if (hot) {
  hot.accept();
  hot.dispose((data) => {
    data.container = container;
  });
}

function createContainer() {
  const container = new Container();
  container.bind(Container).toConstantValue(container);

  const modules = composeModules(servicesModule);
  container.load(modules);

  if (container.has(Initializable)) {
    container
      .getAll(Initializable)
      .forEach((initializable) => initializable.onInitialize());
  }

  return container;
}

export interface ContainerProviderProps {
  children: React.ReactNode;
}
export const ContainerProvider: React.FC<ContainerProviderProps> = ({
  children,
}) => {
  return (
    // <ContainerContext.Provider value={container}>
    <>{children}</>
    // </ContainerContext.Provider>
  );
};

export function useDIContainer(): Container {
  // Used to use a context, but that caused the default value to get passed on hot reloads to components,
  // erroring out as bindings are not found.
  return container;
}

export function useDIDependency<T>(identifier: Identifier<T>): T {
  const container = useDIContainer();
  return container.get(identifier);
}

export function useDICreate<T>(
  identifier: Newable<T>,
  parameters?: ParameterRecord,
): T {
  const container = useDIContainer();
  const valRef = React.useRef<T | null>(null);
  if (valRef.current == null) {
    valRef.current = container.create(identifier, parameters);
  }
  return valRef.current;
}
