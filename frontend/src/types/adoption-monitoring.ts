export interface AdoptionMonitoringPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  animal_id: string;
  adoption_id: string;
  content_tags: Record<string, unknown>;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user_nickname: string;
  user_image: string;
  tags: Array<{
    id: string;
    postId: string;
    tagName: string;
    createdAt: string;
  }>;
  images: Array<{
    id: string;
    postId: string;
    imageUrl: string;
    orderIndex: number;
    createdAt: string;
  }>;
}

export interface AdoptionMonitoringPostsResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number | null;
  data: AdoptionMonitoringPost[];
}
