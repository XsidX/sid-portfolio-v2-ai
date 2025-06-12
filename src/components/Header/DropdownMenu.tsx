'use client';

import React from 'react';
import Link from 'next/link';
import { Link as ScrollLink } from 'react-scroll';
import { AlignJustify } from 'lucide-react';

import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const scrollTarget = {
  About: 'top',
  Contact: 'contact',
  Projects: 'works',
};

const DropdownMenu = ({ tags }: { tags: string[] }) => (
  <div className="relative inline-block text-left md:hidden">
    <ShadcnDropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="px-2 py-2 text-sm shadow-sm border-zinc-400 dark:border-zinc-700 hover:bg-orange-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          aria-label="menu"
        >
          <AlignJustify className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-orange-50 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50"
      >
        {tags.map((tag) => (
          <DropdownMenuItem
            key={tag}
            asChild
            className="cursor-pointer [&[data-highlighted]]:bg-orange-200 dark:[&[data-highlighted]]:bg-zinc-700 [&[data-highlighted]]:text-inherit dark:[&[data-highlighted]]:text-inherit"
          >
            {tag !== 'Resume' && tag !== 'View Source' ? (
              <ScrollLink
                to={scrollTarget[tag as keyof typeof scrollTarget] || 'top'}
                spy
                smooth
                offset={-70}
                duration={500}
                className="w-full text-left"
              >
                {tag}
              </ScrollLink>
            ) : tag === 'Resume' ? (
              <Link
                href="https://docs.google.com/document/d/1Fg2qQOS2DUQ9nt2wWuEzuwG4JHrVEiY85zPv2G2S0nA/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left"
              >
                {tag}
              </Link>
            ) : (
              <Link
                href="https://github.com/XsidX/sid-portfolio"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left"
              >
                {tag}
              </Link>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </ShadcnDropdownMenu>
  </div>
);

export default DropdownMenu;