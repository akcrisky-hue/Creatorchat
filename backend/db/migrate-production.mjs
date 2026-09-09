import fs from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL){console.error('DATABASE_URL is required.');process.exit(2);}
const sql=await fs.readFile(new URL('./schema.sql',import.meta.url),'utf8');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
try{await client.connect();await client.query('BEGIN');await client.query(sql);await client.query('COMMIT');console.log('Production schema migration completed.');}catch(e){try{await client.query('ROLLBACK')}catch{};console.error(e?.message||e);process.exitCode=1;}finally{await client.end().catch(()=>{});}
