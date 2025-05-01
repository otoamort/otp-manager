/**
 * Service for AI-powered assistance in the OTP Manager Pro application.
 * Provides methods for interacting with the AI assistant.
 */
import { ai } from './ai-instance';

/**
 * Interface for AI assistant responses.
 */
export interface AIResponse {
  /** The text response from the AI */
  text: string;
  /** Whether the response was successful */
  success: boolean;
  /** Error message if the response was not successful */
  error?: string;
}

/**
 * Service class that provides methods for interacting with the AI assistant.
 * Uses the genkit library with Google's Gemini model for AI capabilities.
 */
export class AIService {
  /**
   * Asks the AI assistant a question about OTP management.
   * 
   * @param question - The user's question about OTP management
   * @returns A promise that resolves to the AI's response
   */
  static async askQuestion(question: string): Promise<AIResponse> {
    try {
      // Validate input
      if (!question || question.trim() === '') {
        return {
          text: '',
          success: false,
          error: 'Please provide a question to ask the AI assistant.',
        };
      }

      // Use the AI instance to generate a response using the otp-assistant prompt
      const response = await ai.generate({
        promptName: 'otp-assistant',
        inputs: {
          question: question,
        },
      });

      // Return the response
      return {
        text: response.text,
        success: true,
      };
    } catch (error) {
      console.error('Error asking AI assistant:', error);
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets a tip from the AI assistant about OTP security or usage.
   * 
   * @returns A promise that resolves to a random tip from the AI
   */
  static async getRandomTip(): Promise<AIResponse> {
    try {
      // Use the AI instance to generate a random tip
      const response = await ai.generate({
        promptName: 'otp-assistant',
        inputs: {
          question: 'Give me a random tip about OTP security or usage.',
        },
      });

      // Return the response
      return {
        text: response.text,
        success: true,
      };
    } catch (error) {
      console.error('Error getting random tip from AI assistant:', error);
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets help from the AI assistant for troubleshooting an OTP issue.
   * 
   * @param issue - Description of the issue the user is experiencing
   * @returns A promise that resolves to troubleshooting help from the AI
   */
  static async getTroubleshooting(issue: string): Promise<AIResponse> {
    try {
      // Validate input
      if (!issue || issue.trim() === '') {
        return {
          text: '',
          success: false,
          error: 'Please provide a description of the issue you are experiencing.',
        };
      }

      // Use the AI instance to generate troubleshooting help
      const response = await ai.generate({
        promptName: 'otp-assistant',
        inputs: {
          question: `I'm having trouble with my OTP: ${issue}. Can you help me troubleshoot?`,
        },
      });

      // Return the response
      return {
        text: response.text,
        success: true,
      };
    } catch (error) {
      console.error('Error getting troubleshooting help from AI assistant:', error);
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}