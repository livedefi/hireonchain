
//                Default Escrow Program ID
//
// Replace this with your deployed program ID once ready.
// Until then, this placeholder prevents accidental errors.
//
import { PublicKey } from "@solana/web3.js";

// Synced with programs/sol-marketplace (declare_id!) and Anchor.toml [programs.devnet]
export const ESCROW_PROGRAM_ID = new PublicKey(
  "7Aeyy6HZa97qQxvChJB3xW9Tp3phD9ZDSEUqoMJSsbui"
);



//                       Core Client

export { EscrowClient } from "./client";



//                       Instructions

export * from "./instructions";



//                       PDA Derivation

export * from "./pdas";



//                       Types & Errors

export * from "./types";



//                       Utility Helpers

export * from "./utils";




