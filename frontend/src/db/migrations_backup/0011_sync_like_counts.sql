-- 기존 posts 테이블의 likeCount를 실제 post_likes 테이블의 카운트와 동기화
UPDATE posts SET like_count = (
  SELECT COUNT(*) 
  FROM post_likes 
  WHERE post_likes.post_id = posts.id
);
