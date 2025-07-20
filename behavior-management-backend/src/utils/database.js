const { PrismaClient } = require('@prisma/client');
const config = require('../config/env');

/**
 * Database Utilities for PostgreSQL and SQLite
 */

let prisma = null;

/**
 * Get Prisma client instance with appropriate configuration
 */
function getPrismaClient() {
  if (!prisma) {
    const prismaConfig = {
      datasources: {
        db: {
          url: config.DATABASE_URL
        }
      }
    };

    // PostgreSQL-specific optimizations
    if (config.DB_TYPE === 'postgresql') {
      prismaConfig.log = config.IS_DEVELOPMENT ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'];
      
      // Connection pool configuration
      prismaConfig.datasources.db.url = `${config.DATABASE_URL}?connection_limit=${config.DB_POOL_MAX}&pool_timeout=${config.DB_TIMEOUT}`;
    }

    prisma = new PrismaClient(prismaConfig);

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }

  return prisma;
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const client = getPrismaClient();
    
    if (config.DB_TYPE === 'postgresql') {
      // Test PostgreSQL connection with a simple query
      await client.$queryRaw`SELECT version() as version`;
    } else {
      // Test SQLite connection
      await client.$queryRaw`SELECT sqlite_version() as version`;
    }
    
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: 'Database connection failed', 
      error: error.message 
    };
  }
}

/**
 * Get database health information
 */
async function getDatabaseHealth() {
  try {
    const client = getPrismaClient();
    const startTime = Date.now();
    
    let dbInfo = {};
    
    if (config.DB_TYPE === 'postgresql') {
      // PostgreSQL health check
      const [versionResult, connectionsResult, sizeResult] = await Promise.all([
        client.$queryRaw`SELECT version() as version`,
        client.$queryRaw`SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'`,
        client.$queryRaw`
          SELECT pg_size_pretty(pg_database_size(current_database())) as database_size,
                 pg_size_pretty(pg_total_relation_size('users')) as users_table_size
        `
      ]);

      dbInfo = {
        type: 'PostgreSQL',
        version: versionResult[0]?.version || 'Unknown',
        activeConnections: parseInt(connectionsResult[0]?.active_connections) || 0,
        databaseSize: sizeResult[0]?.database_size || 'Unknown',
        usersTableSize: sizeResult[0]?.users_table_size || 'Unknown'
      };
    } else {
      // SQLite health check
      const versionResult = await client.$queryRaw`SELECT sqlite_version() as version`;
      
      dbInfo = {
        type: 'SQLite',
        version: versionResult[0]?.version || 'Unknown',
        activeConnections: 1, // SQLite doesn't have multiple connections
        databaseSize: 'Unknown', // Would need file system access
        usersTableSize: 'Unknown'
      };
    }

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      connectionTime: `${responseTime}ms`,
      database: dbInfo,
      poolConfiguration: config.DB_TYPE === 'postgresql' ? {
        minConnections: config.DB_POOL_MIN,
        maxConnections: config.DB_POOL_MAX,
        timeout: config.DB_TIMEOUT
      } : null
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      database: { type: config.DB_TYPE }
    };
  }
}

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    const { execSync } = require('child_process');
    
    console.log('🔄 Running database migrations...');
    
    if (config.DB_TYPE === 'postgresql') {
      // Ensure PostgreSQL database exists
      await ensurePostgreSQLDatabase();
    }
    
    // Run Prisma migrations
    const migrationOutput = execSync('npx prisma migrate deploy', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log('✅ Migrations completed successfully');
    console.log(migrationOutput);
    
    return { success: true, output: migrationOutput };
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Ensure PostgreSQL database exists
 */
async function ensurePostgreSQLDatabase() {
  if (config.DB_TYPE !== 'postgresql') return;

  try {
    // Connect to PostgreSQL server (not specific database)
    const adminUrl = `postgresql://${config.DB_USER}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/postgres${config.DB_SSL ? '?sslmode=require' : ''}`;
    
    const { Client } = require('pg');
    const adminClient = new Client({ connectionString: adminUrl });
    
    await adminClient.connect();
    
    // Check if database exists
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.DB_NAME]
    );
    
    if (result.rows.length === 0) {
      console.log(`📦 Creating database: ${config.DB_NAME}`);
      await adminClient.query(`CREATE DATABASE "${config.DB_NAME}"`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`✅ Database ${config.DB_NAME} already exists`);
    }
    
    await adminClient.end();
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    throw error;
  }
}

/**
 * Backup database (PostgreSQL only)
 */
async function backupDatabase() {
  if (config.DB_TYPE !== 'postgresql' || !config.DB_BACKUP_ENABLED) {
    return { success: false, message: 'Backup only available for PostgreSQL' };
  }

  try {
    const { execSync } = require('child_process');
    const path = require('path');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = path.join(process.cwd(), 'backups', `backup-${timestamp}.sql`);
    
    // Ensure backup directory exists
    execSync('mkdir -p backups');
    
    // Create PostgreSQL backup
    const pgDumpCommand = `pg_dump "${config.DATABASE_URL}" > "${backupFile}"`;
    execSync(pgDumpCommand);
    
    console.log(`✅ Database backup created: ${backupFile}`);
    return { success: true, backupFile };
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get database performance metrics
 */
async function getDatabaseMetrics() {
  if (config.DB_TYPE !== 'postgresql') {
    return { error: 'Metrics only available for PostgreSQL' };
  }

  try {
    const client = getPrismaClient();
    
    const metrics = await client.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `;

    return { success: true, metrics };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Initialize database connection and run health check
 */
async function initializeDatabase() {
  console.log(`🔌 Initializing ${config.DB_TYPE.toUpperCase()} database...`);
  
  // Test connection
  const connectionTest = await testConnection();
  if (!connectionTest.success) {
    console.error('❌ Database connection failed:', connectionTest.error);
    
    if (config.DB_TYPE === 'postgresql' && connectionTest.error.includes('does not exist')) {
      console.log('🔧 Attempting to create database...');
      try {
        await ensurePostgreSQLDatabase();
        // Retry connection
        const retryTest = await testConnection();
        if (!retryTest.success) {
          throw new Error(retryTest.error);
        }
      } catch (createError) {
        throw new Error(`Failed to create database: ${createError.message}`);
      }
    } else {
      throw new Error(connectionTest.error);
    }
  }

  // Get health information
  const health = await getDatabaseHealth();
  if (health.success) {
    console.log(`✅ Database connected: ${health.database.type} ${health.database.version}`);
    console.log(`⚡ Connection time: ${health.connectionTime}`);
    
    if (health.poolConfiguration) {
      console.log(`🔄 Pool: ${health.poolConfiguration.minConnections}-${health.poolConfiguration.maxConnections} connections`);
    }
  }

  return getPrismaClient();
}

module.exports = {
  getPrismaClient,
  testConnection,
  getDatabaseHealth,
  runMigrations,
  ensurePostgreSQLDatabase,
  backupDatabase,
  getDatabaseMetrics,
  initializeDatabase
}; 