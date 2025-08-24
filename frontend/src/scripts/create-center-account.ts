import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { user } from "../db/schema/auth";
import { eq } from "drizzle-orm";

// SQLite 데이터베이스 연결
const sqlite = new Database("./sqlite.db");
const db = drizzle(sqlite);

async function createCenterAccount() {
  try {
    const centerEmail = "center@test.com";
    const centerPassword = "center123";
    const centerName = "테스트 보호소";

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(centerPassword, 10);

    // 기존 사용자 확인
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, centerEmail))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("이미 존재하는 센터 계정입니다:", centerEmail);
      return;
    }

    // 센터 계정 생성
    const now = new Date();
    await db.insert(user).values({
      id: `center_${Date.now()}`,
      email: centerEmail,
      name: centerName,
      password: hashedPassword,
      userType: "센터관리자",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    console.log("센터 계정이 성공적으로 생성되었습니다!");
    console.log("이메일:", centerEmail);
    console.log("비밀번호:", centerPassword);
    console.log("이름:", centerName);
    console.log("\n이제 센터 로그인 페이지에서 로그인할 수 있습니다.");
  } catch (error) {
    console.error("센터 계정 생성 중 오류 발생:", error);
  } finally {
    sqlite.close();
  }
}

// 스크립트 실행
createCenterAccount();
