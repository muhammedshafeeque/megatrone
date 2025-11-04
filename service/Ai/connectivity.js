import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';

dotenv.config();

export const connectToAi = () => {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not set in environment variables');
  }
  const client = new Mistral({ apiKey });
  return client;
};