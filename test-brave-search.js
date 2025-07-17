// Simple test for brave_search function
import { braveSearch } from './app/chat/tools/searchProviders';

async function testBraveSearch() {
    try {
        console.log('Testing brave_search function...');
        const result = await braveSearch('Best engineering colleges 2025');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testBraveSearch();
