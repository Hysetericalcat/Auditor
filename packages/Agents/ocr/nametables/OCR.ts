import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { pollJob, extractTextContent, cleanOCRResponse} from "../ocr-utils.js";
import {invokeRunpod} from "../../ocr/ocr-utils.js"

dotenv.config();
const IMAGES_DIR = "/Users/chromeblood/audit_checker/audit_checker/Agents/data/bmr-batch-1";
const API_KEY = process.env.RUNPOD_API_KEY as string;
const ENDPOINT = process.env.ENDPOINT as string;


export async function Stage1_agent(){
      

}