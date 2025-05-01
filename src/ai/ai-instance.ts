/**
 * AI integration module for the OTP Manager Pro application.
 * Uses the genkit library with Google's Gemini model for AI capabilities.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

/**
 * Configured AI instance using Google's Gemini model.
 * This instance is used throughout the application for AI-powered features.
 * 
 * @remarks
 * - Requires a GOOGLE_GENAI_API_KEY environment variable to be set
 * - Uses prompts from the ./prompts directory
 * - Uses the gemini-2.0-flash model for fast responses
 */
export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
