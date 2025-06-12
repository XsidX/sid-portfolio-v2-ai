import React from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';

const variants = {
  hidden: { opacity: 0, x: 0, y: 20 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: -0, y: 20 },
};

interface ArticleProps {
  children: React.ReactNode;
  className?: string;
}

const Article = ({ children, className }: ArticleProps) => {
  return (
    <motion.article
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.4, type: 'easeInOut' }}
      style={{ position: 'relative' }}
      className={clsx("mt-10", className)}
    >
      {children}
    </motion.article>
  );
};

export default Article;