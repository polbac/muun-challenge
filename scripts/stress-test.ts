import axios from 'axios';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET;
const API_URL = 'http://localhost:3000';

if (!JWT_SECRET) {
    console.error('JWT_SECRET not found in .env');
    process.exit(1);
}

const redis = new Redis(REDIS_URL);

const generateToken = () => {
    return jwt.sign({ sub: 'stress-test' }, JWT_SECRET);
};

const generateIps = (count: number): string[] => {
    const ips: string[] = [];
    for (let i = 0; i < count; i++) {
        // Generate random IPs 10.x.x.x to avoid collision with real blocked ones mostly
        ips.push(`10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
    }
    return ips;
};

const measure = async (label: string, ips: string[], token: string) => {
    const start = Date.now();
    let errors = 0;
    const promises = ips.map(ip =>
        axios.get(`${API_URL}/ips/${ip}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {
            errors++;
        })
    );

    await Promise.all(promises);
    const duration = Date.now() - start;
    console.log(`[${label}] 500 requests took ${duration}ms. (Avg: ${(duration / ips.length).toFixed(2)}ms/req). Errors: ${errors}`);
    return duration;
};

const runBaseline = async (token: string) => {
    console.log('\n--- Scenario 1: Baseline ---');

    // NO CACHE
    await redis.flushdb();
    const ipsNoCache = generateIps(500);
    console.log('Measuring No Cache (Cold)...');
    const tNoCache = await measure('Baseline - No Cache', ipsNoCache, token);
    const avgNoCache = tNoCache / ipsNoCache.length;

    // WITH CACHE
    await redis.flushdb();
    const ipsCached = generateIps(500);
    console.log('Warming cache for 500 IPs...');
    // Warm up
    await Promise.all(ipsCached.map(ip =>
        axios.get(`${API_URL}/ips/${ip}`, { headers: { Authorization: `Bearer ${token}` } })
    ));

    console.log('Measuring With Cache (Warm)...');
    const tWithCache = await measure('Baseline - With Cache', ipsCached, token);
    const avgWithCache = tWithCache / ipsCached.length;

    // CLEANUP
    await redis.flushdb();

    return { noCache: avgNoCache, withCache: avgWithCache };
};

const runIngestionStress = async (token: string) => {
    console.log('\n--- Scenario 2: Ingestion Stress ---');
    console.log('Starting ingestion...');

    const ingestProcess = spawn('npm', ['run', 'ingest:ips'], {
        cwd: process.cwd(),
        stdio: 'inherit' // Pipe output to see ingestion logs
    });

    // Give ingestion a moment to actually start running/processing
    await new Promise(r => setTimeout(r, 2000));

    // RUN MEASUREMENTS CONCURRENTLY

    // NO CACHE (during ingest)
    // Note: Ingestion clears cache at the end, but we are running *during*.
    // We generate new random IPs that likely aren't cached to ensure we hit the DB.
    const ipsNoCache = generateIps(500);
    console.log('Measuring No Cache (During Ingest) - Ensuring DB Hits...');
    const tNoCache = await measure('Ingest - No Cache', ipsNoCache, token);
    const avgNoCache = tNoCache / ipsNoCache.length;

    // WITH CACHE (during ingest)
    // We will warm up a set of IPs and then test them.
    const ipsCached = generateIps(500);
    console.log('Warming cache (During Ingest)...');
    await Promise.all(ipsCached.map(ip =>
        axios.get(`${API_URL}/ips/${ip}`, { headers: { Authorization: `Bearer ${token}` } })
    ));

    console.log('Measuring With Cache (During Ingest)...');
    const tWithCache = await measure('Ingest - With Cache', ipsCached, token);
    const avgWithCache = tWithCache / ipsCached.length;

    console.log('Waiting for ingestion to finish...');
    await new Promise<void>((resolve) => {
        ingestProcess.on('exit', () => resolve());
    });
    console.log('Ingestion finished.');
    return { noCache: avgNoCache, withCache: avgWithCache };
};

const main = async () => {
    const token = generateToken();
    console.log('Token generated.');

    try {
        const baselineMetrics = await runBaseline(token);
        const ingestMetrics = await runIngestionStress(token);

        console.log('\n\n================================================================');
        console.log('                        STRESS TEST RESULTS                     ');
        console.log('================================================================');
        console.table([
            { Scenario: 'Baseline (Idle)', Condition: 'No Cache (DB Hit)', 'Avg Time (ms)': baselineMetrics.noCache.toFixed(2) },
            { Scenario: 'Baseline (Idle)', Condition: 'With Cache (Hit)', 'Avg Time (ms)': baselineMetrics.withCache.toFixed(2) },
            { Scenario: 'During Ingestion', Condition: 'No Cache (DB Hit)', 'Avg Time (ms)': ingestMetrics.noCache.toFixed(2) },
            { Scenario: 'During Ingestion', Condition: 'With Cache (Hit)', 'Avg Time (ms)': ingestMetrics.withCache.toFixed(2) },
        ]);
        console.log('================================================================\n');

    } catch (e) {
        console.error('Test failed', e);
    } finally {
        await redis.quit();
    }
};

main();
