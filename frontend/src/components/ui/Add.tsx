interface AddProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
}

export function Add({ onMoveUp, onMoveDown, onDelete }: AddProps) {
  return (
    <div className="w-[116px] flex flex-col p-2 rounded-[12px] bg-white border border-bg shadow-lg">
      <button className="w-full py-3 h-[50px] text-center text-bk body" onClick={onMoveUp}>
        위로 올리기
      </button>
      <div className="w-full h-[1px] bg-bg"></div>
      <button className="w-full py-3 h-[50px] text-center text-bk body" onClick={onMoveDown}>
        아래로 내리기
      </button>
      <div className="w-full h-[1px] bg-bg"></div>
      <button className="w-full py-3 h-[50px] text-center text-bk body" onClick={onDelete}>
        삭제하기
      </button>
    </div>
  );
}
