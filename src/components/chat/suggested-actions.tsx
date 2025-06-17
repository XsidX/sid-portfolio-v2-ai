"use client"

import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { memo } from "react"
import type { UseChatHelpers } from "@ai-sdk/react"
import { User, Briefcase, Sparkles, MessageCircle } from "lucide-react"

interface SuggestedActionsProps {
  chatId: string
  append: UseChatHelpers["append"]
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: "Who is Sid",
      label: "Learn about my background",
      action: "Write a short elevator pitch about Sid",
      icon: User,
      gradient: "from-blue-500/10 to-cyan-500/10",
      hoverGradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-600",
    },
    {
      title: "My Projects",
      label: "Explore my work",
      action: "What projects have you worked on?",
      icon: Briefcase,
      gradient: "from-purple-500/10 to-pink-500/10",
      hoverGradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-600",
    },
    {
      title: "Skills & Expertise",
      label: "Discover my capabilities",
      action: "What are your technical skills and areas of expertise?",
      icon: Sparkles,
      gradient: "from-emerald-500/10 to-teal-500/10",
      hoverGradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-600",
    },
    {
      title: "Let's Chat",
      label: "Start a conversation",
      action: "Tell me about your experience and what makes you unique",
      icon: MessageCircle,
      gradient: "from-orange-500/10 to-red-500/10",
      hoverGradient: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-center"
      >
        <h3 className="text-lg font-semibold text-foreground mb-2">Get started with these suggestions</h3>
        <p className="text-sm text-muted-foreground">Choose a topic to learn more about Sid</p>
      </motion.div>

      <div data-testid="suggested-actions" className="flex max-sm:w-[calc(100vw-16px)] max-sm:overflow-x-scroll no-scrollbar sm:grid grid-cols-2 lg:grid-cols-4 gap-3">
        {suggestedActions.map((suggestedAction, index) => {
          const IconComponent = suggestedAction.icon

          return (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{
                delay: 0.1 * index,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              key={`suggested-action-${suggestedAction.title}-${index}`}
              className="group"
            >
              <Button
                variant="ghost"
                onClick={async () => {
                  // window.history.replaceState({}, "", `/chat/${chatId}`)
                  append({
                    role: "user",
                    content: suggestedAction.action,
                  })
                }}
                className={`
                  relative overflow-hidden w-full h-auto p-0 cursor-pointer
                  bg-gradient-to-br ${suggestedAction.gradient}
                  hover:bg-gradient-to-br hover:${suggestedAction.hoverGradient}
                  border border-border/50 hover:border-border
                  rounded-md sm:rounded-2xl transition-all duration-300 ease-out
                  hover:shadow-lg hover:shadow-black/5
                  hover:-translate-y-1 hover:scale-[1.02]
                  active:scale-[0.98] active:translate-y-0
                `}
              >
                <div className="flex flex-col items-start py-1 px-4 sm:p-4 w-full space-y-3">
                  <div
                    className={`
                    hidden sm:block p-2 rounded-xl bg-orange-50/90 dark:bg-zinc-900/20 backdrop-blur-sm
                    group-hover:bg-background/80 transition-colors duration-300
                  `}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${suggestedAction.iconColor} transition-transform duration-300 group-hover:scale-110`}
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <h4 className="font-semibold text-sm text-foreground group-hover:text-foreground/90 transition-colors">
                      {suggestedAction.title}
                    </h4>
                    <p className="hidden sm:block text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors leading-relaxed">
                      {suggestedAction.label}
                    </p>
                  </div>
                </div>

                {/* Subtle shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </Button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export const SuggestedActions = memo(PureSuggestedActions, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false
  return true
})
