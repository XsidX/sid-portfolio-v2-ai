// test-sid.ts
import { getTopicNames, readAboutSid } from './sid';

async function testReadAboutSid() {
    try {
        // Test with a valid topic
        const topic = 'elevator-pitch'; // You can change this to any of the topics
        console.log(`Testing readAboutSid with topic: ${topic}`);
        
        const result = await readAboutSid(topic);
        console.log('Result:');
        console.log('-------------------');
        console.log(result);
        console.log('-------------------');
    } catch (error) {
        console.error('Error:', error as Error);
    }
}

async function testGetTopicNames() {
    try {
        const topicNames = await getTopicNames();
        console.log('Topic names:', topicNames);
    } catch (error) {
        console.error('Error:', error as Error);
    }
}

testGetTopicNames();
testReadAboutSid();