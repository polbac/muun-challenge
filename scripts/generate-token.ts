import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';

async function generateToken() {
    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const authService = app.get(AuthService);
        const token = authService.generateToken();

        console.log('Generated Token:');
        console.log(token);
    } catch (error) {
        console.error('Error generating token:', error.message);
        process.exit(1);
    } finally {
        await app.close();
    }
}

generateToken();
