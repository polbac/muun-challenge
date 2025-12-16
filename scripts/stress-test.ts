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
    const avg = duration / ips.length;
    console.log(`[${label}] 500 requests took ${duration}ms. (Avg: ${avg.toFixed(2)}ms/req). Errors: ${errors}`);
    return avg;
};

const runBaseline = async (token: string) => {
    console.log('\n--- Phase 1: Baseline ---');
    await redis.flushdb();

    // 1. Request 500 IPs (Cold)
    const ips = generateIps(500);
    console.log('Requesting 500 IPs (No Cache)...');
    const avgNoCache = await measure('Baseline - No Cache', ips, token);

    // 2. Request same 500 IPs (Warm)
    console.log('Requesting same 500 IPs (Cached)...');
    const avgCached = await measure('Baseline - Cached', ips, token);

    // Cleanup
    await redis.flushdb();
    return { avgNoCache, avgCached };
};

const runIngestionStress = async (token: string) => {
    console.log('\n--- Phase 2: Ingestion Stress ---');
    console.log('Starting ingestion...');
    const ingestStart = Date.now();

    let totalIps = 0;
    const ingestProcess = spawn('npm', ['run', 'ingest:ips'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe']
    });

    // Capture output to find total IPs
    ingestProcess.stdout.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(output); // Passthrough
        const match = output.match(/Starting ingestion of (\d+) IPs/);
        if (match) {
            totalIps = parseInt(match[1], 10);
        }
    });
    ingestProcess.stderr.pipe(process.stderr);

    // Wait 2s to ensure ingestion starts
    await new Promise(r => setTimeout(r, 2000));

    // 1. Request 500 NEW IPs (Cold) during ingest
    const ips = generateIps(500); // New random IPs
    console.log('Requesting 500 IPs (No Cache, During Ingest)...');
    const avgNoCache = await measure('Ingest - No Cache', ips, token);

    // 2. Request same 500 IPs (Warm) during ingest
    console.log('Requesting same 500 IPs (Cached, During Ingest)...');
    const avgCached = await measure('Ingest - Cached', ips, token);

    console.log('Waiting for ingestion to finish...');
    await new Promise<void>((resolve) => {
        ingestProcess.on('exit', () => resolve());
    });

    const ingestDuration = Date.now() - ingestStart;
    console.log(`Ingestion finished in ${ingestDuration}ms.`);

    const timePerInsert = totalIps > 0 ? (ingestDuration / totalIps) : 0;

    return { avgNoCache, avgCached, ingestDuration, timePerInsert, totalIps };
};

const main = async () => {
    const token = generateToken();
    console.log('Token generated.');

    try {
        const p1 = await runBaseline(token);
        const p2 = await runIngestionStress(token);

        console.log('\n\n================================================================');
        console.log('                        STRESS TEST RESULTS                     ');
        console.log('================================================================');
        console.table([
            { Phase: '1 - Baseline', Condition: 'No Cache', 'Avg Time (ms)': p1.avgNoCache.toFixed(2) },
            { Phase: '1 - Baseline', Condition: 'Cached', 'Avg Time (ms)': p1.avgCached.toFixed(2) },
            { Phase: '2 - Ingest', Condition: 'No Cache', 'Avg Time (ms)': p2.avgNoCache.toFixed(2) },
            { Phase: '2 - Ingest', Condition: 'Cached', 'Avg Time (ms)': p2.avgCached.toFixed(2) },
        ]);

        console.log('\nINGESTION METRICS:');
        console.log(`Total Ingestion Time: ${p2.ingestDuration}ms`);
        console.log(`Total IPs Ingested:   ${p2.totalIps}`);
        console.log(`Avg Time per IP:      ${p2.timePerInsert.toFixed(4)}ms`);
        console.log('================================================================\n');

    } catch (e) {
        console.error('Test failed', e);
    } finally {
        await redis.quit();
    }
};

main();
