import { fromPackageRoot } from '@/lib/utils';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tool } from 'ai';
import { z } from 'zod';

// for testing
// pnpx tsx sid.ts

const sidDir = fromPackageRoot('sid');

export function wrapContentInPrompt(content: string): string {
    const wrappedContent = `Here is the content for this topic: <TopicContent>${content}</TopicContent>`;
    return wrappedContent;
}

export async function readAboutSid(topicName: string): Promise<string> {
    const topicDirs = await fs.readdir(sidDir);
    console.log('sidDir',topicDirs);
    const topicFile = topicDirs.find(f => f.endsWith('.md') && f.replace(/^\d+-/, '').replace('.md', '') === topicName);

    if (!topicFile) {
        throw new Error(`Topic "${topicName}" not found`);
    }

    const topicPath = path.join(sidDir, topicFile);
 
    try {
        const content = await fs.readFile(topicPath, 'utf-8');
        return wrapContentInPrompt(content);
    } catch (error) {
        throw new Error(`Failed to read topic "${topicName}": ${error}`);
    }
}

export const getTopicNames = async (): Promise<string[]> => {
    const topicDirs = await fs.readdir(sidDir);
    return topicDirs.map(f => f.replace(/^\d+-/, '').replace('.md', ''));
}

export const getTopicNamesTool = tool({
    description: 'Get the list of available topics',
    parameters: z.object({}),
    execute: async () => {
        return await getTopicNames();
    },
});

export const readAboutSidTool = tool({
    description: 'Read about a specific topic',
    parameters: z.object({
        topicName: z.string(),
    }),
    execute: async ({ topicName }) => {
        return await readAboutSid(topicName);
    },
});
