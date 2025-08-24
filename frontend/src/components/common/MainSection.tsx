interface MainSectionProps {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  onRightClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function MainSection({
  title,
  subtitle,
  rightSlot,
  onRightClick,
  children,
  className,
}: MainSectionProps) {
  return (
    <section className={`${className} py-8 px-4 flex flex-col gap-3`}>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-bk whitespace-pre-line">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
        </div>
        {rightSlot && (
          <button
            onClick={onRightClick}
            className="text-gr hover:underline cursor-pointer active:opacity-60"
            type="button"
          >
            {rightSlot}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
