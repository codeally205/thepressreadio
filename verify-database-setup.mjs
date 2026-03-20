#!/usr/bin/env node

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const sql = postgres(process.env.DATABASE_URL)

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying database setup...\n')
  
  try {
    // Check all tables and their data
    const tables = [
      { name: 'user', display: 'Users' },
      { name: 'articles', display: 'Artic