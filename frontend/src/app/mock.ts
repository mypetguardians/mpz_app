export const location = [
  "서울",
  "부산",
  "울산",
  "충북",
  "충남",
  "제주",
  "강원",
  "경기",
];

export interface User {
  id: string;
  nickname: string;
  profileImg: string;
  birthDate: string;
  gender: string;
  address: string;
  phoneNumber: string;
  monitoring: string;
}

export const user: User[] = [
  {
    id: "1",
    nickname: "user1",
    profileImg: "/img/dummyImg.png",
    birthDate: "1990 / 01 / 01",
    gender: "남성",
    address: "경상남도 상주시 어디로 어디로 123",
    phoneNumber: "010-1234-5678",
    monitoring: "종료",
  },
  {
    id: "2",
    nickname: "user2",
    profileImg: "/img/dummyImg.png",
    birthDate: "1995 / 05 / 15",
    gender: "여성",
    address: "서울시 강남구 테헤란로 123",
    phoneNumber: "010-9876-5432",
    monitoring: "3일",
  },
];

export interface PetInfo {
  id: string;
  imageUrls: string[];
  waitingDays: number;
  tag: string;
  name: string;
  isFemale: boolean;
  location: string;
  description: string;
  activityLevel: number;
  sensitivity: number;
  sociability: number;
  center: string;
  weight: number;
  age: number;
  color: string;
  announceNumber: string;
  announcementDate: string;
  foundLocation: string;
  specialNotes?: string;
  separationAnxiety?: number;
  healthNotes?: string[];
  basicTraining?: string;
  trainerComment?: string;
  subscriberPosts?: SubscriberPost[];
}

export interface SubscriberPost {
  id: string;
  imageUrl: string;
  ownerName: string;
  content: string;
  timeAgo: string;
  likes: number;
  comments: number;
}

export const mainPetInfo: PetInfo[] = [
  {
    id: "1",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    waitingDays: 8,
    tag: "보호중",
    name: "군밤",
    isFemale: true,
    location: "경기 양평군",
    description: "양쪽 귀 덮혀있으며, 사람을 매우 잘 따름",
    activityLevel: 4,
    sensitivity: 5,
    sociability: 4,
    center: "경상남도 상주시",
    weight: 4,
    age: 8,
    color: "크림색",
    announceNumber: "경기-양평-2024-00241",
    announcementDate: "25.06.10 - 25.06.10",
    foundLocation: "경기 양평군 백운길 263 인근",
    // 구독자용 추가 정보
    specialNotes: "양쪽 귀 덮혀있으며, 사람을 매우 잘 따름",
    separationAnxiety: 4,
    healthNotes: [
      "심장사상충 치료중",
      "심장사상충 치료중",
      "심장사상충 치료중",
    ],
    basicTraining: "기다려, 앉아, 먹어 등 가능",
    trainerComment:
      "사람을 매우 잘 따름 사람을 매우 잘 따름 사람을 매우 잘 따름 사람을 매우 잘 따름 사람을 매우 잘 따름",
    subscriberPosts: [
      {
        id: "1",
        imageUrl: "/img/dummyImg.png",
        ownerName: "군밤이주인",
        content: "안녕 저는 군밤이에요",
        timeAgo: "3일 전",
        likes: 5,
        comments: 13,
      },
      {
        id: "2",
        imageUrl: "/img/dummyImg.png",
        ownerName: "군밤이주인",
        content: "안녕 저는 군밤이에요",
        timeAgo: "3일 전",
        likes: 5,
        comments: 13,
      },
    ],
  },
  {
    id: "2",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    waitingDays: 20,
    tag: "보호중",
    name: "솜이",
    isFemale: true,
    location: "서울 도봉구",
    description: "사랑스러운 반려견을 찾고 있습니다",
    activityLevel: 3,
    sensitivity: 1,
    sociability: 2,
    center: "유기견보호센터",
    weight: 6,
    age: 3,
    color: "흰색",
    announceNumber: "서울-도봉-2024-00123",
    announcementDate: "25.06.15 - 25.07.15",
    foundLocation: "서울시 도봉구 도봉로 123",
  },
  {
    id: "3",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    waitingDays: 18,
    tag: "보호중",
    name: "뽀삐",
    isFemale: true,
    location: "서울 도봉구",
    description: "사랑스러운 반려견을 찾고 있습니다",
    activityLevel: 3,
    sensitivity: 1,
    sociability: 2,
    center: "유기견보호센터",
    weight: 8,
    age: 5,
    color: "갈색",
    announceNumber: "서울-도봉-2024-00124",
    announcementDate: "25.06.12 - 25.07.12",
    foundLocation: "서울시 도봉구 도봉로 456",
  },
  {
    id: "4",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    waitingDays: 18,
    tag: "무지개다리",
    name: "뽀삐",
    isFemale: true,
    location: "서울 도봉구",
    description: "사랑스러운 반려견을 찾고 있습니다",
    activityLevel: 3,
    sensitivity: 1,
    sociability: 2,
    center: "유기견보호센터",
    weight: 5,
    age: 2,
    color: "검정색",
    announceNumber: "서울-도봉-2024-00125",
    announcementDate: "25.06.10 - 25.07.10",
    foundLocation: "서울시 도봉구 도봉로 789",
  },
  {
    id: "5",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    waitingDays: 18,
    tag: "입양완료",
    name: "뽀삐",
    isFemale: true,
    location: "서울 도봉구",
    description: "사랑스러운 반려견을 찾고 있습니다",
    activityLevel: 5,
    sensitivity: 5,
    sociability: 2,
    center: "유기견보호센터",
    weight: 7,
    age: 4,
    color: "흰색",
    announceNumber: "서울-도봉-2024-00126",
    announcementDate: "25.06.08 - 25.07.08",
    foundLocation: "서울시 도봉구 도봉로 101",
  },
  {
    id: "6",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    waitingDays: 18,
    tag: "임시보호중",
    name: "뽀삐",
    isFemale: true,
    location: "서울 도봉구",
    description: "사랑스러운 반려견을 찾고 있습니다",
    activityLevel: 5,
    sensitivity: 5,
    sociability: 2,
    center: "유기견보호센터",
    weight: 9,
    age: 6,
    color: "크림색",
    announceNumber: "서울-도봉-2024-00127",
    announcementDate: "25.06.05 - 25.07.05",
    foundLocation: "서울시 도봉구 도봉로 202",
  },
];

export interface FeedItem {
  id: string;
  nickname: string;
  imageUrls: string[];
  title: string;
  content: string;
  like: number;
  comment: number;
  userId: string;
  date: string;
  tags: string[];
}

export const feedItems: FeedItem[] = [
  {
    id: "1",
    nickname: "군밤이주인",
    imageUrls: ["/img/dummyImg.png"],
    title: "안녕 저는 군밤이에요",
    content:
      "사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요",
    like: 5,
    comment: 13,
    userId: "1",
    date: "2025-05-25",
    tags: ["입양후기", "임시보호"],
  },
  {
    id: "2",
    nickname: "군밤이주인",
    imageUrls: ["/img/dummyImg.png"],
    title: "안녕 저는 군밤이에요",
    content:
      "사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요",
    like: 5,
    comment: 13,
    userId: "2",
    date: "2025-05-25",
    tags: ["입양후기", "임시보호"],
  },
  {
    id: "3",
    nickname: "밤이주인",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    title: "안녕 저는 군밤이에요",
    content:
      "사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요",
    like: 5,
    comment: 13,
    userId: "1",
    date: "2025-05-25",
    tags: ["입양후기", "임시보호"],
  },
  {
    id: "4",
    nickname: "콩이주인",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    title: "안녕 저는 군밤이에요",
    content:
      "사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요",
    like: 5,
    comment: 13,
    userId: "1",
    date: "2025-05-25",
    tags: ["입양후기", "임시보호"],
  },
  {
    id: "5",
    nickname: "흰둥이이주인",
    imageUrls: [
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
      "/img/dummyImg.png",
    ],
    title: "안녕 저는 군밤이에요",
    content:
      "사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요 사랑이 많은 아이에요",
    like: 5,
    comment: 13,
    userId: "1",
    date: "2025-05-25",
    tags: ["입양후기", "임시보호"],
  },
];

export interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export const notification: Notification[] = [
  {
    id: "1",
    title: "입양",
    content: "새로운 아이가 등록됐어요.",
    createdAt: "2025.08.12",
  },
  {
    id: "2",
    title: "입양",
    content: "새로운 아이가 등록됐어요.",
    createdAt: "2025.10.12",
  },
  {
    id: "3",
    title: "임시보호",
    content: "새로운 아이가 등록됐어요.",
    createdAt: "2025.08.30",
  },
];

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  nickname: string;
  profileImg: string;
  content: string;
  date: string;
  like: number;
  replies?: Comment[];
}

export const comments: Comment[] = [
  {
    id: "1",
    postId: "1",
    userId: "1",
    nickname: "강아지사랑",
    profileImg: "/img/dummyImg.png",
    content: "정말 귀여운 강아지네요! 입양 후기 기대하고 있어요 😊",
    date: "2시간 전",
    like: 3,
  },
  {
    id: "2",
    postId: "1",
    userId: "2",
    nickname: "반려동물맘",
    profileImg: "/img/dummyImg.png",
    content: "군밤이 너무 사랑스러워요! 어떤 강아지인지 더 자세히 알려주세요",
    date: "1시간 전",
    like: 1,
    replies: [
      {
        id: "2-1",
        postId: "1",
        userId: "1",
        nickname: "군밤이주인",
        profileImg: "/img/dummyImg.png",
        content:
          "군밤이는 3살 된 말티즈예요! 정말 활발하고 사교적인 아이에요 🐕",
        date: "30분 전",
        like: 2,
      },
    ],
  },
  {
    id: "3",
    postId: "1",
    userId: "1",
    nickname: "입양준비중",
    profileImg: "/img/dummyImg.png",
    content: "입양을 고려하고 있는데, 어떤 준비가 필요한지 조언해주세요",
    date: "30분 전",
    like: 0,
  },
  {
    id: "4",
    postId: "1",
    userId: "2",
    nickname: "펫시터",
    profileImg: "/img/dummyImg.png",
    content: "정말 잘 키우고 계시네요! 군밤이가 행복해 보여요 💕",
    date: "15분 전",
    like: 5,
  },
];

export interface Center {
  id: string;
  name: string;
  imgUrl: string;
  description?: string;
  location: string;
  verified?: boolean;
  phoneNumber?: string;
  adoptionProcedure?: string;
}

export const CenterInfo: Center[] = [
  {
    id: "1",
    name: "center1",
    imgUrl: "/img/dummyImg.png",
    location: "서울시 동작구",
    verified: true,
    phoneNumber: "010-1234-5678",
    adoptionProcedure: "입양 절차",
  },
  {
    id: "2",
    name: "center2",
    imgUrl: "/img/dummyImg.png",
    location: "서울시 동작구",
    verified: false,
    phoneNumber: "010-1234-5678",
    adoptionProcedure: "입양 절차",
  },
  {
    id: "3",
    name: "center3",
    imgUrl: "/img/dummyImg.png",
    location: "서울시 동작구",
    verified: true,
    phoneNumber: "010-1234-5678",
    adoptionProcedure: "입양 절차",
  },
  {
    id: "4",
    name: "center4",
    imgUrl: "/img/dummyImg.png",
    location: "서울시 동작구",
    verified: false,
    phoneNumber: "010-1234-5678",
    adoptionProcedure: "입양 절차",
  },
];

export interface AdoptionResponse {
  question: string;
  answer: string;
}

export const adoptionResponses: AdoptionResponse[] = [
  {
    question: "반려동물을 키워본 경험이 있나요?",
    answer: "네, 강아지를 3년간 키운 경험이 있습니다.",
  },
  {
    question: "하루에 반려동물과 보낼 수 있는 시간은?",
    answer: "평일 2-3시간, 주말 6-8시간 정도입니다.",
  },
  {
    question: "반려동물과 함께 살 수 있는 주거 환경은?",
    answer: "아파트에서 반려동물 허용 동네입니다.",
  },
  {
    question: "반려동물 양육 비용에 대한 계획은?",
    answer: "월 20-30만원 정도 예상하고 있습니다.",
  },
  {
    question: "입양 후 예상되는 어려움은?",
    answer: "처음에는 적응 기간이 필요할 것 같습니다.",
  },
];

export const breed = [
  "믹스견",
  "포메라니안",
  "푸들",
  "말티즈",
  "불독",
  "진도",
  "그레이하운드",
  "비숑",
];

export const weightOptions = ["10kg 이하", "25kg 이하", "그 이상"];
export const ageOptions = ["2살 이하", "7살 이하", "그 이상"];
export const genderOptions = ["남아", "여아"];
export const protectionStatusOptions = [
  "보호중",
  "입양완료",
];
export const expertOpinionOptions = ["포함", "미포함"];
