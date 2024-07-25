declare module "*.svg?react" {
  import React from "react";
  const content: React.ElementType<React.SVGProps<SVGSVGElement>>;
  export default content;
}
