import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Try to load .env
if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

const secret = process.env.JWT_SECRET;
if (!secret) {
    console.error('JWT_SECRET not found in .env');
    process.exit(1);
}

const payload = {
    sub: '123',
    username: 'test-user',
};

const token = jwt.sign(payload, secret, { expiresIn: '24h' });
console.log('Generated Token:');
console.log(token);
