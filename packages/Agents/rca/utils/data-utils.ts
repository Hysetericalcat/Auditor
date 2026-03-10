import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
    retrieveTargetPastBatch,
    retrieveTargetDeviationBatch,
    retrievePastBatches,
    retrieveDeviationBatches,
} from "../../../Databases/vectordb/main";


import batch_118995_past from '../rca-data/past-data/batch_118995.json';
import batch_118997_past from '../rca-data/past-data/batch_118997.json';
import batch_118998_past from '../rca-data/past-data/batch_118998.json';
import batch_119069_past from '../rca-data/past-data/batch_119069.json';

import batch_118995_deviation from '../rca-data/deviation-data/batch_118995.json';
import batch_118997_deviation from '../rca-data/deviation-data/batch_118997.json';
import batch_118998_deviation from '../rca-data/deviation-data/batch_118998.json';
import batch_119069_deviation from '../rca-data/deviation-data/batch_119069.json';

const pastData = [
  batch_118995_past,
  batch_118997_past,
  batch_118998_past,
  batch_119069_past,
];

const DeviationData = [
  batch_118995_deviation,
  batch_118997_deviation,
  batch_118998_deviation,
  batch_119069_deviation,
];

export { pastData, DeviationData };


export const extractTargetBatch = tool(
    async ({ batchNumber }) => {
        const pastData = await retrieveTargetPastBatch(batchNumber);
        const deviationData = await retrieveTargetDeviationBatch(batchNumber);

        if (!pastData && !deviationData) {
            return JSON.stringify({ error: `Batch "${batchNumber}" not found in any collection.` });
        }

        return JSON.stringify({ batchNumber, pastData, deviationData });                                                                            
    },
    {
        name: "extract_target_batch",
        description:
            "Extracts the full JSON data (past manufacturing parameters and deviation analysis) " +
            "for a specific target batch number from the vector database.",
        schema: z.object({
            batchNumber: z.string().describe("The batch number to retrieve data for (e.g. '119069')"),
        }),
    }
);


export const extractLastThreeBatches = tool(
    async ({ batchNumber }) => {
        const pastBatches = await retrievePastBatches(batchNumber, 3);
        const deviationBatches = await retrieveDeviationBatches(batchNumber, 3);

        if (pastBatches.length === 0 && deviationBatches.length === 0) {
            return JSON.stringify({ error: `No preceding batches found before batch "${batchNumber}".` });
        }

        return JSON.stringify({ batchNumber, pastBatches, deviationBatches });
    },
    {
        name: "extract_last_three_batches",
        description:
            "Extracts the full JSON data (past manufacturing parameters and deviation analysis) " +
            "for the last 3 batches manufactured before the given target batch number. " +
            "Results are ordered most-recent-first.",
        schema: z.object({
            batchNumber: z.string().describe("The target batch number — the 3 batches before this one will be returned (e.g. '119069')"),
        }),
    }
);
