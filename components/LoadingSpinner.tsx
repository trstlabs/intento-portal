import { css } from '@stitches/react';

const spinner = css({
  display: 'inline-block',
  width: '40px',
  height: '40px',
  border: '4px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '50%',
  borderTopColor: '#3b82f6',
  animation: 'spin 1s ease-in-out infinite',
  '@keyframes spin': {
    to: { transform: 'rotate(360deg)' },
  },
});

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className={spinner()} />
  </div>
);
