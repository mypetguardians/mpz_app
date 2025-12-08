declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; address: string }) => void;
        onresize?: (size: { width: number; height: number }) => void;
        width?: string | number;
        height?: string | number;
      }) => {
        open: () => void;
        embed: (container: HTMLElement) => void;
      };
    };
  }
}

export const openKakaoAddress = (onComplete: (address: string) => void) => {
  if (typeof window === "undefined" || !window.daum?.Postcode) return;

  // 오버레이 + 임베드 방식 (네이티브 WebView 상단 안전영역 확보)
  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:9999",
    "background:rgba(0,0,0,0.4)",
    "display:flex",
    "justify-content:center",
    "align-items:center",
    "padding:16px",
    "box-sizing:border-box",
  ].join(";");

  const panel = document.createElement("div");
  panel.style.cssText = [
    "width:100%",
    "max-width:520px",
    "height:90vh",
    "background:#fff",
    "border-radius:16px",
    "overflow:hidden",
    "display:flex",
    "flex-direction:column",
    "box-shadow:0 10px 30px rgba(0,0,0,0.15)",
  ].join(";");

  const header = document.createElement("div");
  header.style.cssText = [
    "padding:calc(env(safe-area-inset-top, 16px) + 12px) 16px 12px",
    "display:flex",
    "justify-content:space-between",
    "align-items:center",
    "border-bottom:1px solid #eee",
    "background:#fff",
    "box-sizing:border-box",
  ].join(";");

  const title = document.createElement("div");
  title.textContent = "주소 검색";
  title.style.cssText = "font-size:16px;font-weight:600;color:#111;";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "닫기";
  closeBtn.style.cssText = [
    "border:none",
    "background:#f5f5f5",
    "color:#333",
    "padding:8px 12px",
    "border-radius:10px",
    "font-size:14px",
    "cursor:pointer",
  ].join(";");

  const body = document.createElement("div");
  body.style.cssText = [
    "flex:1",
    "padding:0 12px 12px",
    "box-sizing:border-box",
    "overflow:hidden",
  ].join(";");

  const embedContainer = document.createElement("div");
  embedContainer.style.cssText = [
    "width:100%",
    "height:100%",
    "box-sizing:border-box",
  ].join(";");

  const cleanup = () => {
    overlay.remove();
  };

  closeBtn.onclick = cleanup;
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      cleanup();
    }
  };

  header.appendChild(title);
  header.appendChild(closeBtn);
  body.appendChild(embedContainer);
  panel.appendChild(header);
  panel.appendChild(body);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  new window.daum.Postcode({
    width: "100%",
    height: "100%",
    oncomplete: function (data) {
      const fullAddress = data.roadAddress || data.address;
      onComplete(fullAddress);
      cleanup();
    },
    onresize: function () {
      // embed 컨테이너는 flex로 늘어나므로 별도 처리 불필요
    },
  }).embed(embedContainer);
};
