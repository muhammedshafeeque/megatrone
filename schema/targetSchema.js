import { Schema } from 'arango-typed';
import { collections } from '../constants/Constants.js';
export const targetSchema = new Schema(collections.TARGET, {
    ip: { type: String, required: true },
    ports: { type: Array, required: true },
    services: { type: Array, required: true },
    createdAt: { type: Date, default: Date.now, index: true , unique: true, sparse: true },
    updatedAt: { type: Date, default: Date.now, index: true , unique: true, sparse: true },
    lastScan: { 
        type: String, 
        ref: collections.SCANS,
        index: true,
        sparse: true 
    },
});


