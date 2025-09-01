import React, { useState, useRef, useCallback, useEffect } from "react";

interface SplitpaneProps {
  children: [React.ReactNode, React.ReactNode];
  splitRatio?: number; // percentage (0-100)
  orientation?: "horizontal" | "vertical";
}

const Splitpane = ({ children, splitRatio = 0.5, orientation = "horizontal" }: SplitpaneProps) => {
  const [percent, setPercent] = useState(splitRatio * 100);
  const [isDragging, setIsDragging] = useState(false);
  const splitpaneRef = useRef<HTMLDivElement>(null);
  const separatorRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !splitpaneRef.current) return;

      const container = splitpaneRef.current;
      const containerRect = container.getBoundingClientRect();

      let newSize: number;

      if (orientation === "horizontal") {
        const containerWidth = containerRect.width;
        const mouseX = e.clientX - containerRect.left;
        newSize = (mouseX / containerWidth) * 100;
      } else {
        const containerHeight = containerRect.height;
        const mouseY = e.clientY - containerRect.top;
        newSize = (mouseY / containerHeight) * 100;
      }

      // Apply min/max constraints
      const containerSize =
        orientation === "horizontal" ? containerRect.width : containerRect.height;

      newSize = Math.max(0, Math.min(100, newSize));
      setPercent(newSize);
    },
    [isDragging, orientation]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = orientation === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, orientation]);

  return (
    <div
      ref={splitpaneRef}
      className="splitpane"
      style={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "row" : "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: "none",
          width: orientation === "horizontal" ? `${percent}%` : "100%",
          height: orientation === "horizontal" ? "100%" : `${percent}%`,
          overflow: "hidden",
        }}
      >
        {children[0]}
      </div>

      <div
        ref={separatorRef}
        style={{
          flex: "none",
          cursor: orientation === "horizontal" ? "col-resize" : "row-resize",
          width: orientation === "horizontal" ? "4px" : "100%",
          height: orientation === "horizontal" ? "100%" : "4px",
          position: "relative",
          zIndex: 1,
          backgroundColor: isDragging
            ? "var(--vscode-sash-hoverBorder)"
            : "var(--vscode-sash-border)",
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={e => {
          if (!isDragging) {
            (e.target as HTMLElement).style.backgroundColor = "var(--vscode-sash-hoverBorder)";
          }
        }}
        onMouseLeave={e => {
          if (!isDragging) {
            (e.target as HTMLElement).style.backgroundColor = "var(--vscode-sash-border)";
          }
        }}
      />

      <div
        style={{
          flex: "1",
          overflow: "hidden",
        }}
      >
        {children[1]}
      </div>
    </div>
  );
};

export default Splitpane;
