import React from "react";

interface ScreenReaderContentProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

const ScreenReaderContent = ({
  children,
  ...props
}: ScreenReaderContentProps) => {
  return (
    <span
      {...props}
      style={{
        ...props.style,
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
