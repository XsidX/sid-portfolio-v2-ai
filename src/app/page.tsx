import Home from "@/components/Home";
import { Metadata } from "next";
import { generateUUID } from '@/lib/utils';
import { Chat } from "@/components/chat/chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

export const metadata: Metadata = {
  title: "Sidney Kaguli | Portfolio",
  description: "Full-stack web developer with a focus on remote work",
  keywords: ["web development", "full-stack", "remote work", "portfolio"],
  authors: [{ name: "Sidney Kaguli", url: "https://sidneykaguli.com" }],
  openGraph: {
    title: "Sidney Kaguli | Portfolio",
    description: "Full-stack web developer with a focus on remote work",
    type: "website",
    siteName: "Sidney Kaguli | Portfolio",
    images: [
      {
        url: "https://pbs.twimg.com/profile_images/1545149127054475269/Y5LEA7cQ_400x400.jpg",
        width: 800,
        height: 600,
        alt: "Sidney Kaguli | Portfolio",
      },
    ],
  },
};

export default function HomePage() {
  const id = generateUUID();
  return (
    <>
    <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={DEFAULT_CHAT_MODEL}
        autoResume={false}
      />
    <Home />
    </> 
  );
}