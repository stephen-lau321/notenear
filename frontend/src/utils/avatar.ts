// Teacher avatar utility — uses public placeholder photos
// pravatar.cc generates consistent portraits based on a seed string

const TEACHER_PHOTOS = [
  "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&h=150&fit=crop&crop=face",  // music teacher
  "https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=150&h=150&fit=crop&crop=face",  // teacher at desk
  "https://images.unsplash.com/photo-1544168190-79c17527004f?w=150&h=150&fit=crop&crop=face",  // teaching art
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=150&h=150&fit=crop&crop=face",  // teacher with students
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",  // portrait 1
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",  // portrait 2
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",  // portrait 3
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",  // portrait 4
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",  // portrait 5
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",  // portrait 6
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",  // portrait 7
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",  // portrait 8
];

/**
 * Get a deterministic avatar URL for a teacher based on their user ID or name.
 * If the teacher has a custom avatar uploaded, use that instead.
 */
export function getTeacherAvatar(
  userId: string,
  customAvatar?: string | null
): string {
  if (customAvatar) return customAvatar;

  // Use pravatar.cc for consistent random portraits based on user ID
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(userId)}`;
}

/**
 * Get a photo for a teacher profile/hero display (larger size).
 */
export function getTeacherPhoto(
  userId: string,
  customAvatar?: string | null
): string {
  if (customAvatar) return customAvatar;

  // Use a deterministic index based on userId hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TEACHER_PHOTOS.length;
  return TEACHER_PHOTOS[index];
}
