/**
 * FIXED eBay Marketplace Account Deletion Webhook
 * NOW HANDLES BOTH GET AND POST REQUESTS AS REQUIRED
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Your verification token - eBay will use this to verify notifications
const VERIFICATION_TOKEN = 'pokemon-cards-webhook-2024-secure-abc123';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
    res.json({
        status: '✅ eBay Webhook Server Running (FIXED VERSION)',
        message: 'Ready to handle eBay marketplace notifications',
        endpoints: {
            'account-deletion': '/ebay/account-deletion (GET & POST)',
            'health': '/health'
        },
        timestamp: new Date().toISOString(),
        verificationToken: VERIFICATION_TOKEN
    });
});

// Health endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// FIXED: Handle eBay challenge verification (GET request)
app.get('/ebay/account-deletion', (req, res) => {
    const timestamp = new Date().toISOString();
    
    console.log(`🔐 [${timestamp}] eBay challenge verification (GET request)`);
    console.log('Query parameters:', req.query);
    
    try {
        const challengeCode = req.query.challenge_code;
        
        if (!challengeCode) {
            console.log('❌ No challenge_code in query parameters');
            return res.status(400).json({ 
                error: 'Missing challenge_code parameter' 
            });
        }
        
        // Build the endpoint URL (this exact URL that eBay called)
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const endpoint = `${protocol}://${host}/ebay/account-deletion`;
        
        console.log(`🔍 Challenge verification data:`);
        console.log(`   challengeCode: ${challengeCode}`);
        console.log(`   verificationToken: ${VERIFICATION_TOKEN}`);
        console.log(`   endpoint: ${endpoint}`);
        
        // Create hash in required order: challengeCode + verificationToken + endpoint
        const hash = crypto.createHash('sha256');
        hash.update(challengeCode);
        hash.update(VERIFICATION_TOKEN);
        hash.update(endpoint);
        const challengeResponse = hash.digest('hex');
        
        console.log(`✅ Challenge response: ${challengeResponse}`);
        
        // Return response in required JSON format
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({
            challengeResponse: challengeResponse
        });
        
    } catch (error) {
        console.error(`💥 Challenge verification error: ${error.message}`);
        return res.status(500).json({
            error: 'Challenge verification failed',
            message: error.message
        });
    }
});

// Handle actual account deletion notifications (POST request)
app.post('/ebay/account-deletion', (req, res) => {
    const timestamp = new Date().toISOString();
    
    console.log(`📨 [${timestamp}] eBay notification received (POST request)`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    try {
        // Handle actual marketplace account deletion notifications
        if (req.body.notification_type === 'MARKETPLACE_ACCOUNT_DELETION') {
            console.log('🗑️ Processing account deletion notification...');
            
            const notificationData = {
                type: req.body.notification_type,
                username: req.body.username || 'unknown',
                user_id: req.body.user_id || 'unknown',
                marketplace: req.body.marketplace || 'unknown',
                timestamp: timestamp
            };
            
            console.log('Account deletion details:', notificationData);
            
            // Acknowledge successful processing
            return res.status(200).json({
                status: 'success',
                message: 'Account deletion notification processed',
                processedAt: timestamp,
                notificationData: notificationData
            });
        }
        
        // Handle any other POST notifications
        console.log('📌 Other POST notification received');
        return res.status(200).json({
            status: 'received',
            message: 'Notification processed successfully',
            timestamp: timestamp,
            body: req.body
        });
        
    } catch (error) {
        console.error(`💥 Error processing notification: ${error.message}`);
        
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error processing notification',
            error: error.message,
            timestamp: timestamp
        });
    }
});

// Handle any other requests
app.all('*', (req, res) => {
    if (req.path !== '/' && req.path !== '/health') {
        console.log(`📬 ${req.method} request to unknown path: ${req.path}`);
        res.status(404).json({
            error: 'Endpoint not found',
            availableEndpoints: {
                'home': '/ (GET)',
                'health': '/health (GET)', 
                'webhook': '/ebay/account-deletion (GET & POST)'
            },
            requestedPath: req.path,
            requestedMethod: req.method
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log('🎉 FIXED eBay Webhook Server Started Successfully!');
    console.log('');
    console.log('📊 SERVER INFO:');
    console.log(`   🌐 Port: ${PORT}`);
    console.log(`   🏠 Local: http://localhost:${PORT}`);
    console.log(`   📋 Health: http://localhost:${PORT}/health`);
    console.log('');
    console.log('🔗 WEBHOOK ENDPOINT (FIXED):');
    console.log(`   📍 Path: /ebay/account-deletion`);
    console.log(`   🔍 Methods: GET (challenge) & POST (notifications)`);
    console.log(`   🔐 Token: ${VERIFICATION_TOKEN}`);
    console.log('');
    console.log('📝 FOR eBay PRODUCTION SETUP:');
    console.log(`   🌍 URL: [YOUR-DEPLOYED-URL]/ebay/account-deletion`);
    console.log(`   🎟️  Token: ${VERIFICATION_TOKEN}`);
    console.log('');
    console.log('✅ Ready for eBay challenge verification and notifications!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;