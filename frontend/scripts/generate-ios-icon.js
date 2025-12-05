const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svgPath = path.join(__dirname, "../public/illust/logo.svg");
const outputPath = path.join(
  __dirname,
  "../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
);

async function generateIcon() {
  try {
    // SVG를 1024x1024 PNG로 변환
    await sharp(svgPath)
      .resize(1024, 1024, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(outputPath);

    console.log("✅ iOS 앱 아이콘이 성공적으로 생성되었습니다:", outputPath);
  } catch (error) {
    console.error("❌ 아이콘 생성 중 오류 발생:", error);
    process.exit(1);
  }
}

generateIcon();
