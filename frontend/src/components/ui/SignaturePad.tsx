import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export interface SignaturePadHandle {
  clear: () => void;
  toDataURL: (type?: string) => string | null;
  isEmpty: () => boolean;
}

interface SignaturePadProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  lineWidth?: number;
  strokeStyle?: string;
  backgroundColor?: string;
  onEnd?: (dataUrl: string | null) => void;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  (
    {
      className,
      disabled = false,
      lineWidth = 2.5,
      strokeStyle = "#1f2933",
      backgroundColor = "#ffffff",
      onEnd,
      ...rest
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isDrawingRef = useRef(false);
    const hasSignatureRef = useRef(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const getContext = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const context = canvas.getContext("2d");
      if (!context) return null;
      return context;
    }, []);

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dataUrl = hasSignatureRef.current
        ? canvas.toDataURL("image/png")
        : null;

      const rect = container.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;

      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const context = getContext();
      if (!context) return;

      context.scale(devicePixelRatio, devicePixelRatio);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = lineWidth;
      context.strokeStyle = strokeStyle;
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, rect.width, rect.height);

      if (dataUrl) {
        const image = new Image();
        image.src = dataUrl;
        image.onload = () => {
          context.drawImage(image, 0, 0, rect.width, rect.height);
        };
        hasSignatureRef.current = true;
        setIsEmpty(false);
      } else {
        hasSignatureRef.current = false;
        setIsEmpty(true);
      }
    }, [backgroundColor, getContext, lineWidth, strokeStyle]);

    useEffect(() => {
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }, [resizeCanvas]);

    const getRelativePosition = (event: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (disabled) return;
      const context = getContext();
      if (!context) return;

      isDrawingRef.current = true;
      hasSignatureRef.current = true;
      setIsEmpty(false);

      context.beginPath();
      const { x, y } = getRelativePosition(event);
      context.moveTo(x, y);
      canvasRef.current?.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDrawingRef.current || disabled) return;
      const context = getContext();
      if (!context) return;

      const { x, y } = getRelativePosition(event);
      context.lineTo(x, y);
      context.stroke();
    };

    const endDrawing = (event: PointerEvent) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      const canvas = canvasRef.current;
      const context = getContext();
      if (!canvas || !context) return;

      context.closePath();
      canvas.releasePointerCapture(event.pointerId);

      if (onEnd) {
        const dataUrl = hasSignatureRef.current
          ? canvas.toDataURL("image/png")
          : null;
        onEnd(dataUrl);
      }
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handlePointerLeave = (event: PointerEvent) => {
        if (!isDrawingRef.current) return;
        endDrawing(event);
      };

      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", endDrawing);
      canvas.addEventListener("pointercancel", endDrawing);
      canvas.addEventListener("pointerleave", handlePointerLeave);

      return () => {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", endDrawing);
        canvas.removeEventListener("pointercancel", endDrawing);
        canvas.removeEventListener("pointerleave", handlePointerLeave);
      };
    }, [disabled, endDrawing, handlePointerMove, handlePointerDown]);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      const context = getContext();
      if (!canvas || !context) return;

      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, rect.width, rect.height);
      hasSignatureRef.current = false;
      setIsEmpty(true);

      if (onEnd) {
        onEnd(null);
      }
    }, [backgroundColor, getContext, onEnd]);

    useImperativeHandle(
      ref,
      () => ({
        clear,
        toDataURL: (type?: string) => {
          const canvas = canvasRef.current;
          if (!canvas || !hasSignatureRef.current) return null;
          return canvas.toDataURL(type ?? "image/png");
        },
        isEmpty: () => !hasSignatureRef.current,
      }),
      [clear]
    );

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-[200px] rounded-2xl border border-gray-200 bg-lg overflow-hidden",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
        style={{ touchAction: "none" }}
        {...rest}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          aria-label="서명 입력 영역"
          width={400}
          height={100}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center text-gr text-sm pointer-events-none select-none">
            {disabled ? "서명을 입력할 수 없습니다." : "여기에 서명해주세요"}
          </div>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
