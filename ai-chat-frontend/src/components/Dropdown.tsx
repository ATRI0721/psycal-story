import { useState, useRef,  useLayoutEffect } from "react";
import ReactDOM from "react-dom";

export const Dropdown = ({ children, menuitems, top = false }:{children: React.ReactElement, menuitems: React.ReactNode[], top?: boolean}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });


  useLayoutEffect(() => {
    if (isOpen && menuRef.current) {
        const rect = triggerRef.current!.getBoundingClientRect();

        setPosition({
          top: top ? rect.top - menuRef.current.clientHeight : rect.bottom + 2,
          left: rect.left,
        });
      
      const handleClickOutside = (event: MouseEvent) => {
        if (
          (menuRef.current &&
          !menuRef.current.contains(event.target as Node))
        ) {
          setIsOpen(false);
        }
      };
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      };
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      }
    }
  }, [isOpen,menuRef.current,top]);

  return (
    <div className="relative">
      <div onClick={(e) => {setIsOpen(!isOpen);e.stopPropagation()}} ref={triggerRef} >{children}</div>
      {isOpen &&
        ReactDOM.createPortal(
          <ul
            className="rounded-box z-[9999] p-2 shadow bg-base-100"
            ref={menuRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
            }}
            onClick={() => setIsOpen(false)}
          >
            {menuitems}
          </ul>,
          document.body
        )}
    </div>
  );
};
