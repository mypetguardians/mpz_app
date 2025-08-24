import { Container } from "../common/Container";
import { useState } from "react";
import Link from "next/link";

interface TextMenuProps {
  title: string;
  onClick?: () => void;
  href?: string;
}

export function TextMenu({ title, onClick, href }: TextMenuProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const buttonContent = (
    <button
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`
        py-2 h-[50px] rounded-[8px] font-semibold text-gray-800 transition-all duration-300
        ${isPressed ? "bg-[#F7F7F7] shadow-sm" : "bg-transparent"}
      `}
      style={{
        border: "none",
        outline: "none",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <h3 className="text-bk">{title}</h3>
    </button>
  );

  if (href) {
    return (
      <Container>
        <Link href={href} className="block">
          {buttonContent}
        </Link>
      </Container>
    );
  }

  return <Container>{buttonContent}</Container>;
}
