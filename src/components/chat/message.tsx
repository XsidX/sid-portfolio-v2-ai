"use client"

import type React from "react"

import type { UIMessage } from "ai"
import { AnimatePresence, motion } from "motion/react"
import { memo, useState } from "react"
import { Markdown } from "./markdown"
import equal from "fast-deep-equal"
import { cn, sanitizeText } from "@/lib/utils"
import { CheckCircle, FileText, Hash, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { GradientWheel } from "../ui/gradient-wheel"

// Compact summary for topic names
const TopicNamesSummary = ({ topics, isExpanded }: { topics: string[]; isExpanded: boolean }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <CheckCircle size={16} className="text-orange-600 dark:text-orange-400" />
        <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Found {topics.length} topics</span>
        <div className="flex gap-1">
          {topics.slice(0, 2).map((topic, index) => (
            <span
              key={index}
              className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded"
            >
              {topic}
            </span>
          ))}
          {topics.length > 2 && (
            <span className="text-xs text-orange-600 dark:text-orange-400">+{topics.length - 2} more</span>
          )}
        </div>
      </div>
      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronRight size={16} className="text-orange-600 dark:text-orange-400" />
      </motion.div>
    </div>
  )
}

// Compact summary for content
const ContentSummary = ({ content, isExpanded }: { content: string; isExpanded: boolean }) => {
  const wordCount = content.split(" ").length
  const charCount = content.length

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <CheckCircle size={16} className="text-teal-600 dark:text-teal-400" />
        <span className="text-sm font-medium text-teal-900 dark:text-teal-100">Content retrieved</span>
        <div className="flex items-center gap-3 text-xs text-teal-700 dark:text-teal-300">
          <div className="flex items-center gap-1">
            <FileText size={12} />
            <span>{charCount.toLocaleString()} chars</span>
          </div>
          <div className="flex items-center gap-1">
            <Hash size={12} />
            <span>{wordCount.toLocaleString()} words</span>
          </div>
        </div>
      </div>
      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronRight size={16} className="text-teal-600 dark:text-teal-400" />
      </motion.div>
    </div>
  )
}

// Full detailed view for topic names
const TopicNamesDetail = ({ topics }: { topics: string[] }) => {
  return (
    <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-500/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {topics.map((topic, index) => (
          <motion.div
            key={topic}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-500/10 rounded border border-orange-100 dark:border-orange-800/20"
          >
            <Hash size={12} className="text-orange-500" />
            <span className="text-sm text-orange-800 dark:text-orange-200 font-medium">{topic}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Full detailed view for content
const ContentDetail = ({ content }: { content: string }) => {
  const preview = content.substring(0, 400)

  return (
    <div className="mt-3 pt-3 border-t border-teal-200 dark:border-teal-500/20">
      <div className="bg-white dark:bg-zinc-500/10 rounded border border-teal-100 dark:border-teal-800/20 p-3">
        <div className="text-xs text-teal-600 dark:text-teal-400 mb-2 font-medium">Content Preview:</div>
        <div className="text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed max-h-32 overflow-y-auto">
          {preview}
          {preview.length < content.length && <span className="text-teal-600 dark:text-teal-400">...</span>}
        </div>
      </div>
    </div>
  )
}

// Collapsible agent result component
const CollapsibleAgentResult = ({
  children,
  summary,
  className,
}: {
  children: React.ReactNode
  summary: React.ReactNode
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn("rounded-md border px-2 py-0.5 inline-block", className)}
      >
        <CollapsibleTrigger asChild>
          <button className="hover:bg-black/5 dark:hover:bg-white/5 rounded -m-1 transition-colors">
            {summary}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </motion.div>
    </Collapsible>
  )
}

const PurePreviewMessage = ({
  message,
  requiresScrollPadding,
}: {
  message: UIMessage
  requiresScrollPadding: boolean
}) => {
  // Debug logging
  console.log("PreviewMessage - message:", message)
  console.log("PreviewMessage - parts:", message.parts)

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 font-medium w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            {
              "w-full": true,
              "group-data-[role=user]/message:w-fit": true,
            },
          )}
        >
          {message.role === "assistant" && (
            <GradientWheel size="sm"/>
          )}

          <div
            className={cn("flex flex-col gap-4 w-full", {
              "min-h-96": message.role === "assistant" && requiresScrollPadding,
            })}
          >
            {message.parts?.map((part, index) => {
              const { type } = part
              const key = `message-${message.id}-part-${index}`

              // Debug logging for each part
              console.log(`Part ${index}:`, part)

              if (type === "text") {
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    <div
                      data-testid="message-content"
                      className={cn("flex flex-col gap-4 font-normal tracking-wide", {
                        "bg-orange-500/10 dark:bg-zinc-500/10 text-zinc-900 dark:text-zinc-300 px-4 py-2 mb-4 rounded-xl":
                          message.role === "user",
                      })}
                    >
                      <Markdown>{sanitizeText(part.text)}</Markdown>
                    </div>
                  </div>
                )
              }

              if (type === "tool-invocation") {
                const { toolInvocation } = part
                const { toolName, toolCallId, state } = toolInvocation

                console.log("Tool invocation:", { toolName, toolCallId, state })

                if (state === "result") {
                  const { result } = toolInvocation

                  return (
                    <div key={toolCallId}>
                      {toolName === "getTopicNamesTool" && Array.isArray(result) && (
                        <CollapsibleAgentResult
                          summary={<TopicNamesSummary topics={result} isExpanded={false} />}
                          className="bg-gradient-to-br from-orange-50 to-cyan-50 dark:from-orange-950/20 dark:to-cyan-950/20 border-orange-200 dark:border-orange-800/20"
                        >
                          <TopicNamesDetail topics={result} />
                        </CollapsibleAgentResult>
                      )}
                      {toolName === "readAboutSidTool" && typeof result === "string" && (
                        <CollapsibleAgentResult
                          summary={<ContentSummary content={result} isExpanded={false} />}
                          className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border-teal-200 dark:border-teal-800/20"
                        >
                          <ContentDetail content={result} />
                        </CollapsibleAgentResult>
                      )}
                    </div>
                  )
                }
              }
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export const PreviewMessage = memo(PurePreviewMessage, (prevProps, nextProps) => {
  if (prevProps.message.id !== nextProps.message.id) return false
  if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding) return false
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false

  return true
})

export const ThinkingMessage = () => {
  const role = "assistant"

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      data-role={role}
    >
      <div className="flex gap-4 w-full">
        <GradientWheel size="sm" animate/>
        <motion.div
          className="flex items-center"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          Thinking...
        </motion.div>
      </div>
    </motion.div>
  )
}