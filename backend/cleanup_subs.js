const { poolPromise, sql } = require('./src/config/database');

async function run() {
  const pool = await poolPromise;
  
  // Keep only the latest subscription per user
  await pool.request().query(`
    WITH RankedSubs AS (
      SELECT ID_Subscription,
             ROW_NUMBER() OVER(PARTITION BY ID_Usuario ORDER BY ID_Subscription DESC) as rn
      FROM Push_Subscriptions
    )
    DELETE FROM Push_Subscriptions 
    WHERE ID_Subscription IN (SELECT ID_Subscription FROM RankedSubs WHERE rn > 1);
  `);
  
  console.log("Duplicate subscriptions deleted!");
  process.exit();
}
run();
