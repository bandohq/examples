const { Connection, Keypair, VersionedTransaction } = require('@solana/web3.js');
const axios = require('axios');
const bs58 = require('bs58').default;
require('dotenv').config();

class SolanaBandoExample {
    constructor(privateKeyBase58, rpcUrl = "https://api.mainnet-beta.solana.com") {
        this.connection = new Connection(rpcUrl);
        const privateKeyBytes = bs58.decode(privateKeyBase58);
        this.keypair = Keypair.fromSecretKey(privateKeyBytes);
        this.apiBaseUrl = "https://api.bando.cool/api/v1";
        
        // Add diagnostic flags to help troubleshoot issues
        this.debugMode = true;
    }

    async getQuote(
      sku,
      fiatCurrency = "MXN",
      digitalAsset = "11111111111111111111111111111111",
      chainId = 1151111081099710
    ) {
        const payload = {
            sku: sku,
            fiatCurrency: fiatCurrency,
            digitalAsset: digitalAsset,
            sender: this.keypair.publicKey.toString(),
            chainId: chainId
        };

        try {
            // Log request details in debug mode
            if (this.debugMode) {
                console.log(`Sending quote request to ${this.apiBaseUrl}/quotes/`);
                console.log(`Request payload: ${JSON.stringify(payload, null, 2)}`);
            }
            
            const response = await axios.post(`${this.apiBaseUrl}/quotes/`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            // Log response in debug mode
            if (this.debugMode) {
                console.log(`Quote response: ${JSON.stringify(response.data, null, 2)}`);
            }
            
            return response.data;
        } catch (error) {
            console.error(`Error getting quote: ${error.message}`);
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
                console.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            return null;
        }
    }

    async sendTransaction(transactionData) {
        try {
            // Decode and deserialize the transaction from base64
            const txBytes = Buffer.from(transactionData, 'base64');
            const transaction = VersionedTransaction.deserialize(txBytes);
            
            // Debug the transaction
            console.log('Transaction details:');
            console.log(`  - Version: ${transaction.version}`);
            console.log(`  - Signature count: ${transaction.signatures.length}`);
            console.log(`  - Message account keys: ${transaction.message.accountKeys.length} accounts`);
            
            // If transaction is not already signed, sign it
            if (transaction.signatures.length === 0 || 
                transaction.signatures.some(sig => sig.every(byte => byte === 0))) {
                console.log('Transaction requires signing, adding our signature');
                transaction.sign([this.keypair]);
            } else {
                console.log('Transaction is already signed, not adding our signature');
            }
            
            // Always validate - don't skip preflight checks
            console.log('Sending transaction with validation...');
            const signature = await this.connection.sendTransaction(transaction, {
                skipPreflight: false, // Always validate
                preflightCommitment: 'confirmed',
                maxRetries: 2
            });
                
            console.log(`Transaction submitted with signature: ${signature}`);
            return signature;
        } catch (error) {
            console.error(`Error sending transaction: ${error}`);
            
            if (error.name === 'SendTransactionError') {
                try {
                    const logs = error.logs;
                    if (logs && logs.length) {
                        console.error('Detailed transaction logs:');
                        logs.forEach(log => console.error(`  ${log}`));
                    }
                    
                    // Check for common errors
                    const errorLogs = logs ? logs.join('\n') : '';
                    if (errorLogs.includes('insufficient funds')) {
                        console.error('Error: Insufficient funds in wallet. Please ensure you have enough SOL and tokens.');
                        console.error('This transaction requires the wallet to have:');
                        console.error('  - SOL to pay for transaction fees');
                        console.error('  - The specific token being transferred');
                    } else if (errorLogs.includes('InvalidAccountData')) {
                        console.error('Error: Invalid account data. This typically means:');
                        console.error('  - Your wallet may not be properly set up for this token');
                        console.error('  - The token account needs to be created before transfer');
                        console.error('  - You may not have sufficient token balance');
                    }
                } catch (logError) {
                    console.error('Could not parse transaction logs:', logError.message);
                }
            }
            
            return null;
        }
    }

    async sendPaymentReceipt(
      quote,
      reference,
      requiredFields,
      transactionIntent,
      transactionReceipt
    ) {
        try {
          // Debug the payment receipt data
          console.log('Sending payment receipt with:');
          console.log(`  - Reference: ${reference}`);
          console.log(`  - Required fields: ${JSON.stringify(requiredFields)}`);
          console.log(`  - Transaction intent: ${JSON.stringify(transactionIntent)}`);
          console.log(`  - Transaction receipt: ${JSON.stringify(transactionReceipt)}`);
          console.log(`  - Quote ID: ${quote.id || 'unknown'}`);
          
          // Create the payload
          const payload = {
            reference: reference,
            requiredFields: requiredFields || {}, // Ensure this is at least an empty object
            transactionIntent: transactionIntent,
            transactionReceipt: transactionReceipt
          };
          
          console.log(`Sending payload to API: ${JSON.stringify(payload, null, 2)}`);
          
          // Get quote ID from the proper location in the response structure
          const quoteId = quote.data?.id || quote.id || `manual-${Date.now()}`;
          console.log(`Using idempotency key: ${quoteId}`);
          
          const response = await axios.post(
            `${this.apiBaseUrl}/wallets/${this.keypair.publicKey.toString()}/transactions/?integrator=bando-app`,
            payload,
            {
              headers: { 
                'Content-Type': 'application/json',
                'Idempotency-Key': quoteId
              }
            },
          );
          
          console.log(`Payment receipt API response status: ${response.status}`);
          console.log(`Response data: ${JSON.stringify(response.data)}`);
          
          return response.data;
        } catch (error) {
          console.error(`Error sending payment receipt: ${error.message}`);
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`Status: ${error.response.status}`);
            console.error(`Response data: ${JSON.stringify(error.response.data)}`);
            console.error(`Headers: ${JSON.stringify(error.response.headers)}`);
          } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from API');  
          }
          return null;
        }
    }
    
    async processQuoteAndSend(sku) {
        console.log("Getting quote...");
        
        // Check wallet balance first
        try {
            const balance = await this.connection.getBalance(this.keypair.publicKey);
            console.log(`Wallet SOL balance: ${balance / 1000000000} SOL`);
            
            if (balance < 10000000) { // Less than 0.01 SOL
                console.error('Warning: Low SOL balance may cause transaction failures');
            }
        } catch (error) {
            console.error(`Error checking wallet balance: ${error.message}`);
        }
        
        // Get quote with USDC token address for Solana
        // EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v = USDC on Solana
        const quoteResponse = await this.getQuote(
          sku,
          "MXN",
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // Use USDC instead of 11111...1111
          1151111081099710
        );

        if (!quoteResponse || quoteResponse.error) {
            console.log("Error getting quote");
            return false;
        }
        
        const quoteData = quoteResponse || {};
        const txData = quoteData.transactionRequest?.data;
        const reference = process.env.REFERENCE; //email or phone number
        const requiredFields = quoteData.requiredFields || {};

        if (!txData) {
            console.log("Transaction data not found in quote");
            return false;
        }

        console.log("Quote obtained successfully:");
        console.log(`   Fiat amount: ${quoteData.fiatAmount} ${quoteData.fiatCurrency}`);
        console.log(`   Digital amount: ${quoteData.digitalAssetAmount}`);
        console.log(`   Fee: ${quoteData.feeAmount}`);
        console.log(`   Total: ${quoteData.totalAmount}`);

        console.log("\nSending transaction...");
        const signature = await this.sendTransaction(txData);

        if (!signature) {
            console.log("Error sending transaction");
            return false;
        }
        
        // Wait for transaction confirmation and verify success
        console.log("\nWaiting for transaction confirmation...");
        try {
            // Wait for confirmation

            const confirmationResult = await this.connection.confirmTransaction(signature, 'confirmed');
            
            // Check for transaction errors
            if (confirmationResult.value.err) {
                console.error(`Transaction failed on-chain: ${JSON.stringify(confirmationResult.value.err)}`);
                return false;
            }
            
            // Verify transaction success by getting transaction details
            const transactionDetails = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });
            
            // Check if transaction was successful
            if (!transactionDetails || transactionDetails.meta.err) {
                console.error(`Transaction verification failed: ${transactionDetails?.meta?.err || 'Unknown error'}`);
                return false;
            }
                        
            // Create transaction intent and receipt objects
            const transactionIntent = {
                sku: quoteData.sku,
                quantity: 1,
                amount: quoteData.totalAmount,
                chain: "1151111081099710",
                token: quoteData.digitalAsset,
                wallet: this.keypair.publicKey.toString(),
                integrator: "bando-app",
                hasAcceptedTerms: true,
                quoteId: quoteData.id,
            };
            
            const transactionReceipt = {
                hash: signature,
                virtualMachineType: "SVM"
            };
            
            // Send payment receipt
            console.log("\nSending payment receipt...");
            const receiptResponse = await this.sendPaymentReceipt(
                quoteResponse,
                reference,
                requiredFields,
                transactionIntent,
                transactionReceipt
            );
            
            if (!receiptResponse) {
                console.log("Error sending payment receipt");
                return false;
            }
            
            console.log("Payment receipt sent successfully!");
            console.log(`   Receipt ID: ${receiptResponse.id || 'N/A'}`);
            return true;
        } catch (error) {
            console.error(`Error confirming transaction: ${error.message}`);
            return false;
        }
    }
}

// Replace this with your actual private key (in Base58 format)
const PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;
// Actual sandbox MXN SKU with very low denomination for testing
const SKU = "0c1d5d7c-f35c-432a-bc45-6f999d061f5b";

(async () => {
    try {
        const handler = new SolanaBandoExample(PRIVATE_KEY);
        const success = await handler.processQuoteAndSend(SKU);
        console.log(success ? "\nProcess completed successfully!" : "\nProcess failed");
    } catch (error) {
        console.error(`General error: ${error.message}`);
    }
})();