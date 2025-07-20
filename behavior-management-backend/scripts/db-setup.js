#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment configuration
require('dotenv').config();
const config = require('../src/config/env');

/**
 * Database Setup and Management Script
 * Handles switching between SQLite and PostgreSQL configurations
 */

function copySchemaFile() {
  const baseSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const sqliteSchemaPath = path.join(__dirname, '../prisma/schema.sqlite.prisma');
  
  if (config.DB_TYPE === 'sqlite') {
    console.log('📄 Using SQLite schema...');
    
    // Copy SQLite schema to main schema file
    if (fs.existsSync(sqliteSchemaPath)) {
      fs.copyFileSync(sqliteSchemaPath, baseSchemaPath);
      console.log('✅ SQLite schema configured');
    } else {
      console.error('❌ SQLite schema file not found');
      process.exit(1);
    }
  } else if (config.DB_TYPE === 'postgresql') {
    console.log('📄 Using PostgreSQL schema...');
    
    // The main schema.prisma is already configured for PostgreSQL
    console.log('✅ PostgreSQL schema configured');
  } else {
    console.error('❌ Invalid DB_TYPE. Must be "sqlite" or "postgresql"');
    process.exit(1);
  }
}

function runPrismaGenerate() {
  try {
    console.log('🔄 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
    process.exit(1);
  }
}

function runMigrations() {
  try {
    if (config.DB_TYPE === 'postgresql') {
      console.log('🔄 Running PostgreSQL migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } else {
      console.log('🔄 Pushing SQLite schema...');
      execSync('npx prisma db push', { stdio: 'inherit' });
    }
    console.log('✅ Database schema updated successfully');
  } catch (error) {
    console.error('❌ Failed to update database schema:', error.message);
    process.exit(1);
  }
}

function createPostgreSQLMigration() {
  if (config.DB_TYPE !== 'postgresql') {
    console.log('⚠️  Migration creation only available for PostgreSQL');
    return;
  }

  try {
    console.log('🔄 Creating new PostgreSQL migration...');
    const migrationName = process.argv[3] || 'update_schema';
    execSync(`npx prisma migrate dev --name ${migrationName}`, { stdio: 'inherit' });
    console.log('✅ Migration created successfully');
  } catch (error) {
    console.error('❌ Failed to create migration:', error.message);
    process.exit(1);
  }
}

function resetDatabase() {
  try {
    console.log('⚠️  Resetting database...');
    
    if (config.DB_TYPE === 'postgresql') {
      execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    } else {
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    }
    
    console.log('✅ Database reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset database:', error.message);
    process.exit(1);
  }
}

function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed database:', error.message);
    process.exit(1);
  }
}

function showStatus() {
  console.log('\n🔧 Database Configuration Status:');
  console.log(`  - Database Type: ${config.DB_TYPE}`);
  console.log(`  - Database URL: ${config.DATABASE_URL}`);
  
  if (config.DB_TYPE === 'postgresql') {
    console.log(`  - Host: ${config.DB_HOST}:${config.DB_PORT}`);
    console.log(`  - Database: ${config.DB_NAME}`);
    console.log(`  - User: ${config.DB_USER}`);
    console.log(`  - SSL: ${config.DB_SSL}`);
    console.log(`  - Pool: ${config.DB_POOL_MIN}-${config.DB_POOL_MAX} connections`);
  }
  
  console.log('\n📁 Available Commands:');
  console.log('  setup    - Configure schema and generate client');
  console.log('  migrate  - Run database migrations');
  console.log('  create   - Create new migration (PostgreSQL only)');
  console.log('  reset    - Reset database (⚠️  destructive)');
  console.log('  seed     - Seed database with sample data');
  console.log('  status   - Show this status information');
  console.log('\n💡 Usage: npm run db:setup [command]');
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'setup':
    copySchemaFile();
    runPrismaGenerate();
    break;
    
  case 'migrate':
    copySchemaFile();
    runMigrations();
    break;
    
  case 'create':
    copySchemaFile();
    createPostgreSQLMigration();
    break;
    
  case 'reset':
    copySchemaFile();
    resetDatabase();
    break;
    
  case 'seed':
    seedDatabase();
    break;
    
  case 'status':
    showStatus();
    break;
    
  default:
    console.log('🚀 Setting up database...');
    copySchemaFile();
    runPrismaGenerate();
    console.log('\n✅ Database setup complete!');
    showStatus();
} 