interface AddProps {
  buttons: Array<{
    text: string;
    onClick: () => void;
  }>;
}

export function Add({ buttons }: AddProps) {
  return (
    <div className="w-[116px] flex flex-col p-2 rounded-[12px] bg-white border border-bg">
      {buttons.map((button, index) => (
        <div key={index}>
          <button
            className="w-full py-3 h-[50px] text-center text-bk body"
            onClick={button.onClick}
          >
            {button.text}
          </button>
          {index < buttons.length - 1 && (
            <div className="w-full h-[1px] bg-bg"></div>
          )}
        </div>
      ))}
    </div>
  );
}
