import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

/**
 * 안전한 password 해싱 유틸리티
 * Node.js의 내장 crypto 모듈을 사용하여 업계 표준의 안전한 password 해싱을 제공합니다.
 * scrypt 알고리즘을 사용하여 메모리 기반 공격에도 강한 해싱을 제공합니다.
 */

const scryptAsync = promisify(scrypt);

// scrypt 설정
const SCRYPT_CONFIG = {
  N: 16384, // CPU 비용 (2^14)
  r: 8, // 메모리 비용
  p: 1, // 병렬화 비용
  keylen: 64, // 출력 키 길이
  saltLength: 32, // salt 길이
} as const;

// bcryptjs는 선택적으로 사용 (런타임에 확인)
let bcrypt: typeof import("bcryptjs") | null = null;
try {
  // 동적 import 사용
  import("bcryptjs")
    .then((bcryptModule) => {
      bcrypt = bcryptModule;
    })
    .catch(() => {
      console.warn("bcryptjs not available, using scrypt only");
    });
} catch {
  console.warn("bcryptjs not available, using scrypt only");
}

/**
 * scrypt를 사용하여 비밀번호를 해싱합니다 (권장 방법)
 *
 * @param password - 해싱할 평문 비밀번호
 * @returns Promise<string> - 해싱된 비밀번호 (salt + hash)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // 랜덤 salt 생성
    const salt = randomBytes(SCRYPT_CONFIG.saltLength);

    // scrypt로 해싱 (기본 설정 사용)
    const derivedKey = (await scryptAsync(
      password,
      salt,
      SCRYPT_CONFIG.keylen
    )) as Buffer;

    // salt와 hash를 base64로 인코딩하여 결합
    const saltBase64 = salt.toString("base64");
    const hashBase64 = derivedKey.toString("base64");

    return `scrypt$${SCRYPT_CONFIG.N}$${SCRYPT_CONFIG.r}$${SCRYPT_CONFIG.p}$${saltBase64}$${hashBase64}`;
  } catch (error) {
    console.error("Password hashing error:", error);
    throw new Error("비밀번호 해싱 중 오류가 발생했습니다");
  }
}

/**
 * 평문 비밀번호와 해시된 비밀번호를 비교하여 검증합니다.
 *
 * @param password - 검증할 평문 비밀번호
 * @param hashedPassword - 저장된 해시된 비밀번호
 * @returns Promise<boolean> - 비밀번호 일치 여부
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // 해시 형식 확인
    if (hashedPassword.startsWith("scrypt$")) {
      return await verifyScryptPassword(password, hashedPassword);
    } else if (hashedPassword.startsWith("$2") && bcrypt) {
      // bcrypt 해시인 경우 (legacy 지원)
      return await bcrypt.compare(password, hashedPassword);
    } else {
      console.warn("Unknown password hash format");
      return false;
    }
  } catch (error) {
    console.error("Password verification error:", error);
    throw new Error("비밀번호 검증 중 오류가 발생했습니다");
  }
}

/**
 * scrypt 해시를 검증합니다.
 */
async function verifyScryptPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const parts = hashedPassword.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const N = parseInt(parts[1]);
  const r = parseInt(parts[2]);
  const p = parseInt(parts[3]);
  const saltBase64 = parts[4];
  const expectedHashBase64 = parts[5];

  const salt = Buffer.from(saltBase64, "base64");
  const expectedHash = Buffer.from(expectedHashBase64, "base64");

  const derivedKey = (await scryptAsync(
    password,
    salt,
    expectedHash.length
  )) as Buffer;

  // 타이밍 공격 방지를 위한 상수 시간 비교
  return timingSafeEqual(derivedKey, expectedHash);
}

/**
 * bcrypt를 사용한 비밀번호 해싱 (legacy 지원용)
 *
 * @param password - 해싱할 평문 비밀번호
 * @returns Promise<string> - 해싱된 비밀번호
 */
export async function hashPasswordBcrypt(password: string): Promise<string> {
  if (!bcrypt) {
    throw new Error("bcryptjs가 설치되지 않았습니다");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    return hashedPassword;
  } catch (error) {
    console.error("Bcrypt hashing error:", error);
    throw new Error("비밀번호 해싱 중 오류가 발생했습니다");
  }
}

/**
 * 동기식으로 평문 비밀번호를 해싱합니다.
 * 주의: 동기식 함수는 이벤트 루프를 블록할 수 있으므로 가능한 한 비동기 함수를 사용하세요.
 *
 * @param password - 해싱할 평문 비밀번호
 * @returns string - 해싱된 비밀번호
 */
export function hashPasswordSync(password: string): string {
  if (!bcrypt) {
    throw new Error("동기식 해싱은 bcryptjs가 필요합니다");
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 12);
    return hashedPassword;
  } catch (error) {
    console.error("Password hashing sync error:", error);
    throw new Error("비밀번호 해싱 중 오류가 발생했습니다");
  }
}

/**
 * 동기식으로 평문 비밀번호와 해시된 비밀번호를 비교합니다.
 * 주의: 동기식 함수는 이벤트 루프를 블록할 수 있으므로 가능한 한 비동기 함수를 사용하세요.
 *
 * @param password - 검증할 평문 비밀번호
 * @param hashedPassword - 저장된 해시된 비밀번호
 * @returns boolean - 비밀번호 일치 여부
 */
export function verifyPasswordSync(
  password: string,
  hashedPassword: string
): boolean {
  if (!bcrypt) {
    throw new Error("동기식 검증은 bcryptjs가 필요합니다");
  }

  try {
    const isMatch = bcrypt.compareSync(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Password verification sync error:", error);
    throw new Error("비밀번호 검증 중 오류가 발생했습니다");
  }
}

/**
 * 현재 해시가 업그레이드가 필요한지 확인합니다.
 *
 * @param hashedPassword - 확인할 해시된 비밀번호
 * @returns boolean - 해시 업그레이드 필요 여부
 */
export function needsPasswordUpgrade(hashedPassword: string): boolean {
  try {
    if (hashedPassword.startsWith("scrypt$")) {
      const parts = hashedPassword.split("$");
      if (parts.length !== 6) return true;

      const N = parseInt(parts[1]);
      const r = parseInt(parts[2]);
      const p = parseInt(parts[3]);

      // 현재 설정과 비교
      return N < SCRYPT_CONFIG.N || r < SCRYPT_CONFIG.r || p < SCRYPT_CONFIG.p;
    } else if (hashedPassword.startsWith("$2") && bcrypt) {
      // bcrypt 해시는 항상 업그레이드 권장
      return true;
    } else {
      // 알 수 없는 형식은 업그레이드 필요
      return true;
    }
  } catch (error) {
    console.error("Password upgrade check error:", error);
    return true;
  }
}

/**
 * 비밀번호 강도를 검증합니다.
 *
 * @param password - 검증할 비밀번호
 * @returns object - 검증 결과와 메시지
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
} {
  const errors: string[] = [];
  let score = 0;

  // 최소 길이 체크 (8자 이상)
  if (password.length < 8) {
    errors.push("비밀번호는 최소 8자 이상이어야 합니다");
  } else {
    score += 1;
  }

  // 최대 길이 체크 (128자 이하)
  if (password.length > 128) {
    errors.push("비밀번호는 최대 128자 이하여야 합니다");
  }

  // 대문자 포함 체크
  if (!/[A-Z]/.test(password)) {
    errors.push("비밀번호에 대문자가 포함되어야 합니다");
  } else {
    score += 1;
  }

  // 소문자 포함 체크
  if (!/[a-z]/.test(password)) {
    errors.push("비밀번호에 소문자가 포함되어야 합니다");
  } else {
    score += 1;
  }

  // 숫자 포함 체크
  if (!/\d/.test(password)) {
    errors.push("비밀번호에 숫자가 포함되어야 합니다");
  } else {
    score += 1;
  }

  // 특수문자 포함 체크
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("비밀번호에 특수문자가 포함되어야 합니다");
  } else {
    score += 1;
  }

  // 강도 결정
  let strength: "weak" | "medium" | "strong";
  if (score <= 2) {
    strength = "weak";
  } else if (score <= 4) {
    strength = "medium";
  } else {
    strength = "strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * 개발/테스트 환경에서만 사용할 수 있는 간단한 해싱 함수
 * 운영 환경에서는 절대 사용하지 마세요!
 *
 * @param password - 해싱할 평문 비밀번호
 * @returns Promise<string> - 해싱된 비밀번호 (개발용)
 */
export async function hashPasswordForDevelopment(
  password: string
): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("개발용 해싱 함수는 운영 환경에서 사용할 수 없습니다");
  }

  // 개발 환경에서는 더 빠른 설정 사용
  const salt = randomBytes(8);
  const derivedKey = (await scryptAsync(password, salt, 32)) as Buffer;

  const saltBase64 = salt.toString("base64");
  const hashBase64 = derivedKey.toString("base64");

  return `scrypt$1024$1$1$${saltBase64}$${hashBase64}`;
}

/**
 * 비밀번호와 해시가 서로 업그레이드가 필요한지 확인하고 필요시 업그레이드를 수행합니다.
 *
 * @param password - 평문 비밀번호
 * @param oldHash - 기존 해시
 * @returns Promise<{ isValid: boolean; newHash?: string; upgraded: boolean }>
 */
export async function verifyAndUpgradePassword(
  password: string,
  oldHash: string
): Promise<{ isValid: boolean; newHash?: string; upgraded: boolean }> {
  const isValid = await verifyPassword(password, oldHash);

  if (!isValid) {
    return { isValid: false, upgraded: false };
  }

  const needsUpgrade = needsPasswordUpgrade(oldHash);

  if (needsUpgrade) {
    const newHash = await hashPassword(password);
    return { isValid: true, newHash, upgraded: true };
  }

  return { isValid: true, upgraded: false };
}

// 현재 설정 정보를 export
export const PASSWORD_CONFIG = {
  SCRYPT_CONFIG,
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  HASH_FORMAT: {
    SCRYPT: "scrypt",
    BCRYPT: "$2",
  },
} as const;
