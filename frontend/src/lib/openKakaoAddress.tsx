declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { roadAddress: string; address: string }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

export const openKakaoAddress = (onComplete: (address: string) => void) => {
  if (typeof window === "undefined" || !window.daum?.Postcode) return;

  new window.daum.Postcode({
    oncomplete: function (data) {
      const fullAddress = data.roadAddress || data.address;
      onComplete(fullAddress);
    },
  }).open();
};
