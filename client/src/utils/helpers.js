/**
 * Format file size from bytes to human-readable string
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Format date to relative time string
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format date to full date/time string
 */
export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge class
 */
export function getStatusClass(status) {
  const map = {
    draft: 'badge-draft',
    pending: 'badge-pending',
    signed: 'badge-signed',
    rejected: 'badge-rejected',
  };
  return map[status] || 'badge-draft';
}

/**
 * Get status display label
 */
export function getStatusLabel(status) {
  const map = {
    draft: 'Draft',
    pending: 'Pending',
    signed: 'Signed',
    rejected: 'Rejected',
  };
  return map[status] || status;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 30) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
