#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'

const connectionString = 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function createTables() {
  console.log('🚀 Creating tables manually...\n')
  
  try {
    const sql = neon(connectionString)
    
    // Create user table first
    console.log('Creating user table...')
    await sql`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text,
        "email" text NOT NULL UNIQUE,
        "emailVerified" timestamp,
        "image" text,
        "avatar_url" text,
        "auth_provider" text NOT NULL DEFAULT 'email',
        "password_hash" text,
        "role" text DEFAULT 'viewer',
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `
    console.log('✅ User table created')
    
    // Create articles table
    console.log('Creating articles table...')
    await sql`
      CREATE TABLE IF NOT EXISTS "articles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "excerpt" text,
        "content" text,
        "featured_image" text,
        "video_url" text,
        "category" text NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "is_featured" boolean DEFAULT false NOT NULL,
        "is_premium" boolean DEFAULT false NOT NULL,
        "views" integer DEFAULT 0 NOT NULL,
        "reading_time" integer DEFAULT 5 NOT NULL,
        "author_id" uuid,
        "published_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        "meta_title" text,
        "meta_description" text,
        "tags" text[],
        "newsletter_sent" boolean DEFAULT false NOT NULL,
        "newsletter_sent_at" timestamp with time zone
      )
    `
    console.log('✅ Articles table created')
    
    // Create ads table
    console.log('Creating ads table...')
    await sql`
      CREATE TABLE IF NOT EXISTS "ads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "image_url" text,
        "link_url" text,
        "button_text" text DEFAULT 'Learn More',
        "position" text DEFAULT 'sidebar' NOT NULL,
        "status" text DEFAULT 'active' NOT NULL,
        "priority" integer DEFAULT 0 NOT NULL,
        "impressions" integer DEFAULT 0 NOT NULL,
        "clicks" integer DEFAULT 0 NOT NULL,
        "start_date" timestamp with time zone,
        "end_date" timestamp with time zone,
        "target_audience" text DEFAULT 'unsubscribed' NOT NULL,
        "created_by" uuid,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `
    console.log('✅ Ads table created')
    
    // Create other essential tables
    const otherTables = [
      {
        name: 'account',
        sql: `
          CREATE TABLE IF NOT EXISTS "account" (
            "userId" uuid NOT NULL,
            "type" text NOT NULL,
            "provider" text NOT NULL,
            "providerAccountId" text NOT NULL,
            "refresh_token" text,
            "access_token" text,
            "expires_at" integer,
            "token_type" text,
            "scope" text,
            "id_token" text,
            "session_state" text,
            CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
          )
        `
      },
      {
        name: 'session',
        sql: `
          CREATE TABLE IF NOT EXISTS "session" (
            "sessionToken" text PRIMARY KEY NOT NULL,
            "userId" uuid NOT NULL,
            "expires" timestamp NOT NULL
          )
        `
      },
      {
        name: 'verificationToken',
        sql: `
          CREATE TABLE IF NOT EXISTS "verificationToken" (
            "identifier" text NOT NULL,
            "token" text NOT NULL,
            "expires" timestamp NOT NULL,
            CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
          )
        `
      },
      {
        name: 'subscriptions',
        sql: `
          CREATE TABLE IF NOT EXISTS "subscriptions" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "user_id" uuid NOT NULL,
            "stripe_subscription_id" text,
            "paystack_subscription_code" text,
            "status" text NOT NULL,
            "plan_type" text NOT NULL,
            "amount" integer NOT NULL,
            "currency" text DEFAULT 'USD' NOT NULL,
            "interval" text NOT NULL,
            "current_period_start" timestamp with time zone NOT NULL,
            "current_period_end" timestamp with time zone NOT NULL,
            "trial_start" timestamp with time zone,
            "trial_end" timestamp with time zone,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
            "canceled_at" timestamp with time zone
          )
        `
      }
    ]
    
    for (const table of otherTables) {
      console.log(`Creating ${table.name} table...`)
      await sql.unsafe(table.sql)
      console.log(`✅ ${table.name} table created`)
    }
    
    // Verify tables
    console.log('\n🔍 Verifying tables...')
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    console.log(`✅ Found ${tables.length} tables:`)
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`)
    })
    
    console.log('\n🎉 Tables created successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

createTables()