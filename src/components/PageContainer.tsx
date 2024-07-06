import React from "react";

import { useDIDependency } from "@/container";

import { PageManager } from "@/services/page";

export interface PageContainerProps {
  title: string;
  children: React.ReactNode;
}

const PageContainer = ({ title, children }: PageContainerProps) => {
  const pageManager = useDIDependency(PageManager);

  React.useLayoutEffect(() => {
    pageManager.setTitle(title);
    return () => {
      pageManager.setTitle(null);
    };
  }, [title]);

  return children;
};

export default PageContainer;
