import React from 'react';

  interface SectionHeadingProps {
  children: React.ReactNode;
  overlay?: boolean;
  className?: string;
}

const SectionHeading = ({ children, overlay, className }: SectionHeadingProps) => (
  <h2 className={overlay ? `font-bold text-zinc-500 dark:text-zinc-100 font-mplus opacity-20 dark:opacity-10 ${className}` : 'my-2 text-lg font-mplus underline-offset-4 underline decoration-4 decoration-zinc-600 text-zinc-900 dark:text-zinc-50 transition duration-500 ease-in-out'}>
    {children}
  </h2>
);

export default SectionHeading;
