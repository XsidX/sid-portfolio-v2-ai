"use client"

import { useState } from "react"
import { ArrowUp } from "lucide-react"
import { Chat } from "./chat"
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models"
import { generateUUID } from "@/lib/utils"
import { Dialog, DialogContent } from "../ui/dialog"
import { useScroll } from "motion/react"
import clsx from "clsx"
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Link as ScrollLink } from 'react-scroll';
import { GradientWheel } from "../ui/gradient-wheel"


export default function StickyNav() {
  const [isOpen, setIsOpen] = useState(false)

  const { scrollY } = useScroll();
  const isScrolled = scrollY.get() > 0;
  console.log(isScrolled);

  const id = generateUUID();
  return (
    <div className="sticky top-[60px] z-50">
      {/* Sticky Navigation Bar */}
      <nav className="bg-white dark:bg-black border dark:border-white/20 rounded-full">
        <div className="flex items-center px-4 py-3">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* AI Wheel Icon with Gradient */}
            <button onClick={() => setIsOpen(!isOpen)} className="relative cursor-pointer">
              <GradientWheel />
            </button>

            <span className="font-medium whitespace-nowrap">Ask My Assistant</span>
          </div>

          <div className="hidden md:block w-full text-center">
            <span className="dark:text-white/70 text-black/70 text-base">I launch full-stack products: plan, design, code, on time.</span>
          </div>

          <div className="flex items-center gap-4">
            <ScrollLink to="header" spy smooth offset={-160}>  
              <button type="button" className="p-2 dark:text-white/75 text-black/75 dark:hover:text-white hover:text-black transition-colors cursor-pointer">
                <ArrowUp className="w-5 h-5" />
              </button>
            </ScrollLink>
          </div>
        </div>
      </nav>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <VisuallyHidden>
          <DialogTitle>Ask My Assistant</DialogTitle>
          <DialogDescription>
            Ask me anything you want to know about my work and projects.
          </DialogDescription>
        </VisuallyHidden>
        <DialogContent className={clsx("border-2 border-teal-500/5 max-sm:px-0 md:-ml-2 sm:max-w-3xl max-w-full h-[calc(100vh-300px)] bg-orange-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-300 rounded-3xl", !isScrolled ? "top-[calc(100vh-420px)]" : "top-[calc(100vh-455px)]")}>
          <Chat
            key={id}
            id={id}
            initialMessages={[]}
            initialChatModel={DEFAULT_CHAT_MODEL}
            autoResume={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}