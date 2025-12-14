import { useRef, useEffect } from "react";

type Props = {
  children: React.ReactNode;
  onClickOutside: () => void;
  onKeyDowns?: string[];
};

function ClickOutsideWrapper({ children, onClickOutside, onKeyDowns=["Escape"] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClickOutside();
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      for (const key of onKeyDowns) {
        if (e.key === key) {
          onClickOutside();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeydown);

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [onClickOutside, onKeyDowns]);

  return <div ref={containerRef}>{children}</div>;
}

export default ClickOutsideWrapper;
