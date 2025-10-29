import React from 'react';

export const OvertimeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const SickPayIcon = (props: React.SVGProps<SVGSVGElement>) => (
 <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 2a10 10 0 1 0-8.59 14.7" />
    <path d="M12 2a10 10 0 1 0-10 10" />
    <path d="M12 12a5 5 0 0 0-5 5" />
    <path d="m15.5 9.5-3 3" />
    <path d="m12.5 12.5 3-3" />
  </svg>
);
