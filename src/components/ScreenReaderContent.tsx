import * as React from "react";

interface ScreenReaderContentProps {
  children: React.ReactNode;
}

const ScreenReaderContent = ({ children }: ScreenReaderContentProps) => {
  return (
    <span
      style={{
        clip: "rect(1px, 1px, 1px, 1px)",
        clipPath: "inset(50%)",
        height: "1px",
        overflow: "hidden",
        position: "absolute",
        whiteSpace: "nowrap",
        width: "1px",
        margin: "-1px",
      }}
    >
      {children}
    </span>
  );
};

export default ScreenReaderContent;
