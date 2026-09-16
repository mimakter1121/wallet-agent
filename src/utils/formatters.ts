export const formatNotificationTime = (timestampStr?: string): string => {
  if (!timestampStr) return '';
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) return timestampStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getAvatarGradient = (nameOrId?: string): string => {
  const gradients = [
    'from-[#00c853] to-[#00701a]', // Emerald Green
    'from-[#00b0ff] to-[#006097]', // Electric Blue
    'from-[#7c4dff] to-[#4a148c]', // Deep Purple
    'from-[#ff9100] to-[#b26a00]', // Amber Orange
    'from-[#00bfa5] to-[#00695c]', // Teal
    'from-[#f50057] to-[#880e4f]', // Pink / Rose
    'from-[#00e5ff] to-[#00838f]', // Cyan
    'from-[#ff5252] to-[#b71c1c]', // Coral Red
    'from-[#ffd600] to-[#f57f17]'  // Solar Gold
  ];
  if (!nameOrId) return gradients[0];
  let hash = 0;
  for (let i = 0; i < nameOrId.length; i++) {
    hash = nameOrId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};
