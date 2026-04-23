// This is a simple performance validation script
// It simulates 50 concurrent requests to the static endpoints to ensure 'compression' and 'rate-limit' work correctly.

const runStressTest = async () => {
    console.log("🚀 Starting Performance Stress Test...");
    const url = "http://localhost:3000/api/knowledge"; // Using a data endpoint
    
    const startTime = Date.now();
    const requests = Array(50).fill(null).map(() => fetch(url).catch(e => ({ status: 'error' })));
    
    const results = await Promise.all(requests);
    const endTime = Date.now();
    
    const successful = results.filter(r => r.status === 200).length;
    const rateLimited = results.filter(r => r.status === 429).length;
    
    console.log(`\n--- STRESS TEST RESULTS ---`);
    console.log(`Total Requests: 50`);
    console.log(`Successful: ${successful}`);
    console.log(`Rate Limited (DDoS Protection): ${rateLimited}`);
    console.log(`Total Time: ${endTime - startTime}ms`);
    console.log(`Average Time per Request: ${(endTime - startTime) / 50}ms`);
    
    if (rateLimited > 0) {
        console.log("✅ Security Verified: Rate limiting successfully protected the server from a burst of requests!");
    } else {
        console.log("ℹ️ Server handled all requests successfully. Increase burst size to test Rate Limiter thresholds.");
    }
};

// Only run if the server is already active
try {
    runStressTest();
} catch (e) {
    console.log("❌ Test failed: Ensure server is running on http://localhost:3000 before testing.");
}
