import { Schema } from 'arango-typed';
import { collections } from '../constants/Constants.js';
export const scanSchema = new Schema(collections.SCANS, {
    target: { type: String, required: true },
    ports: { type: Array, required: true },
    services: { type: Array, required: true },
    tool: { type: String, required: true },
    result: { type: String, required: true },
    command: { type: String, required: true },
    interestingAnalysis: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true , unique: true, sparse: true },
    updatedAt: { type: Date, default: Date.now, index: true , unique: true, sparse: true },
});