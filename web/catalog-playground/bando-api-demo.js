#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
require('dotenv').config();

const { formatProductResponse, formatError, displayHeader } = require('./utils/formatters');
const { CacheManager } = require('./utils/cache');
const { runScenarios } = require('./examples/scenarios');

// Configuration
const BANDO_API_BASE = 'https://api.bando.cool/api/v1';
const API_TOKEN = process.env.BANDO_API_TOKEN || null; // Optional for higher rate limits

// Initialize cache manager
const cache = new CacheManager(300000); // 5 minutes cache

// Rate limiting configuration
let requestCount = 0;
let windowStart = Date.now();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = API_TOKEN ? 100 : 10; // Higher limit with auth

/**
 * Rate limiting check
 */
function checkRateLimit() {
    const now = Date.now();
    
    // Reset window if needed
    if (now - windowStart > RATE_LIMIT_WINDOW) {
        requestCount = 0;
        windowStart = now;
    }
    
    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
        throw new Error(`Rate limit exceeded. ${MAX_REQUESTS_PER_WINDOW} requests per minute allowed.`);
    }
    
    requestCount++;
}

/**
 * Make API request to Bando products/grouped endpoint
 */
async function fetchProducts(filters = {}) {
    try {
        checkRateLimit();
        
        // Build query parameters
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const url = `${BANDO_API_BASE}/products/grouped/${params.toString() ? '?' + params.toString() : ''}`;
        
        // Check cache first
        const cacheKey = url;
        const cachedResponse = cache.get(cacheKey);
        if (cachedResponse) {
            console.log(chalk.yellow('📦 Using cached response'));
            return cachedResponse;
        }
        
        // Prepare headers
        const headers = {
            'Accept': 'application/json',
            'User-Agent': 'Bando-API-Demo/1.0.0'
        };
        
        // Add authorization header if token is available (for higher rate limits)
        if (API_TOKEN) {
            headers['Authorization'] = `Bearer ${API_TOKEN}`;
        }
        
        console.log(chalk.blue('🔄 Making API request...'));
        console.log(chalk.gray(`URL: ${url}`));
        
        const response = await axios.get(url, {
            headers,
            timeout: 30000
        });
        
        // Cache the response
        cache.set(cacheKey, response.data);
        
        return response.data;
        
    } catch (error) {
        if (error.response) {
            // API returned an error response
            const { status, data } = error.response;
            
            switch (status) {
                case 401:
                    throw new Error('Unauthorized: Invalid or missing API token. The API may require authentication for this endpoint.');
                case 403:
                    throw new Error('Forbidden: Access denied. This might be due to repeated invalid attempts.');
                case 429:
                    throw new Error('Rate limit exceeded. Please wait before making more requests.');
                case 404:
                    throw new Error('Endpoint not found. The API endpoint might be different or require specific authentication. Contact api@bando.cool for current API documentation.');
                case 500:
                    throw new Error('Internal server error. Please try again later.');
                default:
                    throw new Error(`API Error (${status}): ${data?.message || 'Unknown error occurred'}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. Please check your internet connection or try again later.');
        } else if (error.code === 'ENOTFOUND') {
            throw new Error('Network error: Unable to reach Bando API. Please check your internet connection.');
        } else {
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}

/**
 * Interactive product filtering
 */
async function interactiveDemo() {
    displayHeader('🎯 Interactive Bando API Demo');
    
    console.log(chalk.cyan('\nAvailable filters:'));
    console.log('• country - Filter by country code (e.g., "US", "MX", "CA")');
    console.log('• type - Filter by product type (e.g., "esim", "topup", "gift_card")');
    console.log('• brand - Filter by specific brand (e.g., "llbean", "att")');
    console.log('• subType - Filter by product subtype');
    console.log('• pageSize - Number of items per page (default: 10)');
    console.log('• pageNumber - Page number to retrieve (default: 1)');
    
    const filters = {};
    
    // Get user input for filters
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => readline.question(query, resolve));
    
    try {
        filters.country = await question('\nCountry code (e.g., US): ');
        filters.type = await question('Product type (esim/topup/gift_card): ');
        filters.brand = await question('Brand name (optional): ');
        filters.pageSize = await question('Page size (default 10): ') || '10';
        
        readline.close();
        
        const data = await fetchProducts(filters);
        formatProductResponse(data, filters);
        
    } catch (error) {
        readline.close();
        throw error;
    }
}

/**
 * Command line interface
 */
const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('country', {
        alias: 'c',
        type: 'string',
        description: 'Filter by country code (e.g., US, MX)'
    })
    .option('type', {
        alias: 't',
        type: 'string',
        description: 'Filter by product type (esim, topup, gift_card)',
        choices: ['esim', 'topup', 'gift_card']
    })
    .option('brand', {
        alias: 'b',
        type: 'string',
        description: 'Filter by brand name'
    })
    .option('subType', {
        alias: 's',
        type: 'string',
        description: 'Filter by product subtype'
    })
    .option('pageSize', {
        alias: 'p',
        type: 'number',
        description: 'Number of items per page',
        default: 10
    })
    .option('pageNumber', {
        alias: 'n',
        type: 'number',
        description: 'Page number to retrieve',
        default: 1
    })
    .option('interactive', {
        alias: 'i',
        type: 'boolean',
        description: 'Run in interactive mode'
    })
    .option('scenarios', {
        alias: 'demo',
        type: 'boolean',
        description: 'Run predefined demonstration scenarios'
    })
    .option('auth-test', {
        type: 'boolean',
        description: 'Test authentication status'
    })
    .option('clear-cache', {
        type: 'boolean',
        description: 'Clear response cache'
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Show verbose output including request details'
    })
    .option('test-connection', {
        type: 'boolean',
        description: 'Test API endpoint connectivity'
    })
    .help('h')
    .alias('h', 'help')
    .example('$0 --country US --type esim', 'Get eSIM products for US')
    .example('$0 --type gift_card --brand llbean', 'Get LLBean gift cards')
    .example('$0 --interactive', 'Run in interactive mode')
    .example('$0 --scenarios', 'Run demonstration scenarios')
    .example('$0 --test-connection', 'Test API connectivity')
    .epilogue('For more information, visit: https://docs.bando.cool')
    .argv;

/**
 * Test API endpoint connectivity
 */
async function testConnection() {
    displayHeader('🌐 API Connection Test');
    
    const testEndpoints = [
        '/products/grouped/',
        '/products/',
        '/countries/',
        '/quotes/'
    ];
    
    // Use the correct base URL for testing
    const testBaseUrl = 'https://api.bando.cool/api/v1';
    
    console.log(chalk.blue('🔄 Testing API endpoint variations...'));
    
    for (const endpoint of testEndpoints) {
        const testUrl = `${testBaseUrl}${endpoint}`;
        
        try {
            console.log(chalk.gray(`Testing: ${testUrl}`));
            
            const headers = {
                'Accept': 'application/json',
                'User-Agent': 'Bando-API-Demo/1.0.0'
            };
            
            if (API_TOKEN) {
                headers['Authorization'] = `Bearer ${API_TOKEN}`;
            }
            
            const response = await axios.head(testUrl, {
                headers,
                timeout: 10000,
                validateStatus: (status) => status < 500 // Accept 4xx as valid responses
            });
            
            console.log(chalk.green(`  ✅ ${response.status}: Endpoint accessible`));
            
            if (response.status === 200) {
                console.log(chalk.cyan(`  🎯 Found working endpoint: ${testUrl}`));
                return testUrl;
            }
            
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 401) {
                    console.log(chalk.yellow(`  🔐 ${status}: Requires authentication`));
                } else if (status === 404) {
                    console.log(chalk.red(`  ❌ ${status}: Not found`));
                } else {
                    console.log(chalk.gray(`  ℹ️ ${status}: ${error.response.statusText}`));
                }
            } else {
                console.log(chalk.red(`  ❌ Network error: ${error.message}`));
            }
        }
    }
    
    console.log(chalk.yellow('\n📞 Next steps:'));
    console.log(chalk.white('  • Contact api@bando.cool for current API documentation'));
    console.log(chalk.white('  • Request access to the API endpoints'));
    console.log(chalk.white('  • Verify the correct base URL and authentication method'));
}

/**
 * Authentication test
 */
async function testAuthentication() {
    displayHeader('🔐 Authentication Test');
    
    if (!API_TOKEN) {
        console.log(chalk.yellow('⚠️  No API token found in environment variables'));
        console.log(chalk.gray('Running with public access (limited rate limits)'));
        console.log(chalk.gray('Set BANDO_API_TOKEN environment variable for higher limits'));
        return;
    }
    
    try {
        console.log(chalk.blue('🔄 Testing API token...'));
        const data = await fetchProducts({ pageSize: 1 });
        console.log(chalk.green('✅ Authentication successful!'));
        console.log(chalk.gray(`Rate limit: ${MAX_REQUESTS_PER_WINDOW} requests per minute`));
    } catch (error) {
        console.log(chalk.red('❌ Authentication failed:'));
        formatError(error);
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        // Clear cache if requested
        if (argv.clearCache) {
            cache.clear();
            console.log(chalk.green('✅ Cache cleared'));
            return;
        }
        
        // Test API connection if requested
        if (argv.testConnection) {
            await testConnection();
            return;
        }
        
        // Test authentication if requested
        if (argv.authTest) {
            await testAuthentication();
            return;
        }
        
        // Run scenarios if requested
        if (argv.scenarios) {
            await runScenarios(fetchProducts);
            return;
        }
        
        // Run interactive mode if requested
        if (argv.interactive) {
            await interactiveDemo();
            return;
        }
        
        // Build filters from command line arguments
        const filters = {};
        ['country', 'type', 'brand', 'subType', 'pageSize', 'pageNumber'].forEach(key => {
            if (argv[key] !== undefined) {
                filters[key] = argv[key];
            }
        });
        
        // If no filters provided, show help
        if (Object.keys(filters).length === 0) {
            displayHeader('🚀 Bando API Products Demo');
            console.log(chalk.yellow('No filters specified. Use --help for usage information.'));
            console.log(chalk.cyan('\nQuick start options:'));
            console.log('• node bando-api-demo.js --scenarios (run demo scenarios)');
            console.log('• node bando-api-demo.js --interactive (interactive mode)');
            console.log('• node bando-api-demo.js --country US --type esim (specific filter)');
            return;
        }
        
        // Fetch and display products
        const data = await fetchProducts(filters);
        formatProductResponse(data, filters);
        
    } catch (error) {
        console.log(chalk.red('\n❌ Error occurred:'));
        formatError(error);
        process.exit(1);
    }
}

// Export for testing
module.exports = {
    fetchProducts,
    testAuthentication
};

// Run if called directly
if (require.main === module) {
    main();
}
