const {
    createPublicClient,
    createWalletClient,
    http,
    hexToBigInt
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { arbitrum } = require('viem/chains');
const axios = require('axios');
require('dotenv').config();

class EVMBandoExample {
    constructor(privateKey, rpcUrl = process.env.EVM_RPC_URL) {
        this.account = privateKeyToAccount(privateKey);
        this.publicClient = createPublicClient({
            chain: arbitrum,
            transport: http(rpcUrl)
        });
        this.walletClient = createWalletClient({
            account: this.account,
            chain: arbitrum,
            transport: http(rpcUrl)
        });
        this.apiBaseUrl = "https://apidev.bando.cool/api/v1";
    }

    async getQuote(
      sku,
      fiatCurrency = "MXN",
      digitalAsset = "0x0000000000000000000000000000000000000000", // ETH
      chainId = 42161 // Arbitrum
    ) {
        const payload = {
            sku: sku,
            fiatCurrency: fiatCurrency,
            digitalAsset: digitalAsset,
            sender: this.account.address,
            chainId: chainId
        };

        try {
            const response = await axios.post(`${this.apiBaseUrl}/quotes/`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            console.error(`Error getting quote: ${error.message}`);
            return null;
        }
    }

    async sendTransaction(transactionData) {
        try {
            // Prepare transaction parameters
            const txParams = {
                to: transactionData.to,
                data: transactionData.data,
                value: hexToBigInt(transactionData.value),
            };
            // Send the transaction
            const hash = await this.walletClient.sendTransaction(txParams);
            return hash;
        } catch (error) {
            console.error(`Error sending transaction: ${error.message}`);
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
          const payload = {
            reference: reference,
            requiredFields: requiredFields,
            transactionIntent: transactionIntent,
            transactionReceipt: transactionReceipt
          };
          const response = await axios.post(
            `${this.apiBaseUrl}/wallets/${this.account.address}/transactions/?integrator=bando-app`,
            payload,
            {
              headers: { 
                'Content-Type': 'application/json',
                'Idempotency-Key': `${quote.id}`
              }
            }
          );
          return response.data;
        } catch (error) {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`Status: ${error.response.status}`);
            console.error(`Response data: ${JSON.stringify(error.response.data)}`);
            console.error(`Headers: ${JSON.stringify(error.response.headers)}`);
          }
          return null;
        }
    }
    
    async processQuoteAndSend(sku) {
        console.log("Getting quote...");
        const quoteResponse = await this.getQuote(
          sku,
          "MXN",
          //0x0000000000000000000000000000000000000000 ETH on Arbitrum
          "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
          42161 // Arbitrum
        );

        if (!quoteResponse || quoteResponse.error) {
            console.log("Error getting quote");
            return false;
        }
        
        const quoteData = quoteResponse || {};
        const txData = quoteData.transactionRequest;
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
        const txHash = await this.sendTransaction(txData);

        if (!txHash) {
            console.log("Error sending transaction");
            return false;
        }
        
        console.log("Transaction sent successfully!");
        console.log(`   Transaction Hash: ${txHash}`);
        
        // Wait for transaction confirmation
        console.log("\nWaiting for transaction confirmation...");
        try {
            // Wait for the transaction to be mined
            const receipt = await this.publicClient.waitForTransactionReceipt({
                hash: txHash,
                confirmations: 1
            });
            
            if (receipt.status === 'reverted') {
                console.log("Transaction failed!");
                return false;
            }
            
            console.log("Transaction confirmed!");
            
            // Create transaction intent and receipt objects
            const transactionIntent = {
                sku: quoteData.sku,
                quantity: 1,
                amount: quoteData.totalAmount,
                chain: "42161", // Arbitrum
                token: quoteData.digitalAsset,
                wallet: this.account.address,
                integrator: "bando-app",
                hasAcceptedTerms: true,
                quoteId: quoteData.id,
            };
            
            const transactionReceipt = {
                hash: txHash, // In EVM, this would be the transaction hash
                virtualMachineType: "EVM"
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

// Replace this with your actual private key (hex format with 0x prefix)
const PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;
// Actual sandbox SKU with very low denomination
const SKU = "3575087f-f2b6-49e2-8235-5c4e298db6a3";

(async () => {
    try {
        const handler = new EVMBandoExample(PRIVATE_KEY);
        const success = await handler.processQuoteAndSend(SKU);
        console.log(success ? "\nProcess completed successfully!" : "\nProcess failed");
    } catch (error) {
        console.error(`General error: ${error.message}`);
    }
})();