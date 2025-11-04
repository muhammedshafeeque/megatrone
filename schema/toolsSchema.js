import { Schema } from 'arango-typed';
import { collections } from '../constants/Constants.js';
export const toolsSchema = new Schema(collections.TOOLS, {
    tool: { type: String, required: true },
    description: { type: String, required: true },
    commandsExample: { type: Array, required: true },
    updatedAt: { type: Date, default: Date.now, index: true , unique: true, sparse: true },
});