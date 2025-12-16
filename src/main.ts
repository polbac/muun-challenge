import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('IP Blocklist Service Assignment Service')
    .setDescription('IP Blocklist Service Assignment Service')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const customCss = `
    .topbar { background-color: #010c1c !important; }
    .topbar-wrapper img,.topbar-wrapper svg { display: none; }
    .topbar-wrapper a::before {
        content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI0IiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgMTI0IDQ4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTEuMTIzNiAzMy44NTExVjE4LjI5NDhDMTEuMTIzNiAxOC4yOTQ4IDEyLjUyMTEgMTcuNTk5OSAxNS4xOTE4IDE3LjU5OTlDMTcuODYyNCAxNy41OTk5IDE5LjA1MjQgMTguNTkyNiAxOS4wNTI0IDIxLjM4NjJWMzMuODUxMUgyMi44ODU0VjIxLjM4NjJDMjIuODg1NCAyMC4xMjQxIDIyLjg4NTQgMTkuMTU5OCAyMi44NzE2IDE4LjQyMjRDMjMuNDgwNCAxOC4wODIgMjQuNjcwNCAxNy41OTk5IDI2LjYzNTQgMTcuNTk5OUMyOS42Nzk2IDE3LjU5OTkgMzAuODE0MyAxOC41OTI2IDMwLjgxNDMgMjEuMzg2MlYzMy44NTExSDM0Ljk1MTdWMjEuMzg2MkMzNC45NTE3IDE5LjUwMDEgMzQuNTY0MiAxNy41MjkgMzMuMTgwNSAxNi4wOTY3QzMxLjc4MjkgMTQuNjY0NSAyOS43OTAzIDEzLjcxNDQgMjYuNjc2OSAxMy43MTQ0QzIzLjg4MTcgMTMuNzE0NCAyMS40MTg2IDE0LjY5MjggMjAuOTM0MyAxNC45MDU1QzE5LjM3MDcgMTQuMTU0IDE3LjE3MDUgMTMuNzE0NCAxNS4yMTk1IDEzLjcxNDRDMTEuNDI4IDEzLjcxNDQgNyAxNC45NDgxIDcgMTQuOTQ4MVYzMy44NTExSDExLjEyMzZaIiBmaWxsPSIjMzk3MERCIi8+CjxwYXRoIGQ9Ik02Mi4yMTIxIDEzLjcxNDRWMzEuNDI0NVYzMi42MTc0QzYyLjIxMjEgMzIuNjE3NCA2MS43Mzg4IDMyLjc0NzUgNjAuOTUwMiAzMi45MjMxQzU5LjMxIDMzLjI4ODUgNTYuMzA2IDMzLjg1MTEgNTMuMzU5IDMzLjg1MTFDNTAuMjA0MSAzMy44NTExIDQ3LjY4ODUgMzIuODg2OCA0Ni4yODQ4IDMxLjQ2ODdDNDQuODgxMSAzMC4wMzY1IDQ0LjUwNTggMjguMDY1MyA0NC41MDU4IDI2LjE3OTNWMTMuNzE0NEg0OC42NjE0VjI2LjE2NTFDNDguNjYxNCAyOC45NTg3IDUwLjMyOTIgMjkuOTUxNCA1My4zODY4IDI5Ljk1MTRDNTYuNDQ0NCAyOS45NTE0IDU4LjA3MDUgMjkuMjU2NSA1OC4wNzA1IDI5LjI1NjVWMTMuNzE0NEg2Mi4yMTIxWiIgZmlsbD0iIzM5NzBEQiIvPgo8cGF0aCBkPSJNODkuNDc5MSAxMy43MTQ0VjMyLjYxNzRDODkuNDc5MSAzMi42MTc0IDg0Ljk5IDMzLjg1MTEgODAuNjI2IDMzLjg1MTFDNzcuNDcxMSAzMy44NTExIDc0Ljk1NTUgMzIuODg2OCA3My41NTE4IDMxLjQ2ODdDNzIuMTQ4MSAzMC4wMzY1IDcxLjc3MjkgMjguMDY1MyA3MS43NzI5IDI2LjE3OTNWMTMuNzE0NEg3NS45Mjg0VjI2LjE2NTFDNzUuOTI4NCAyOC45NTg3IDc3LjU5NjIgMjkuOTUxNCA4MC42NTM4IDI5Ljk1MTRDODMuNzExNCAyOS45NTE0IDg1LjMzNzUgMjkuMjU2NSA4NS4zMzc1IDI5LjI1NjVWMTMuNzE0NEg4OS40NzkxWiIgZmlsbD0iIzM5NzBEQiIvPgo8cGF0aCBkPSJNOTkuMDA4IDMzLjg1MTFWMTQuOTQ4MUM5OS4wMDggMTQuOTQ4MSAxMDMuNDk3IDEzLjcxNDQgMTA3Ljg2MSAxMy43MTQ0QzExMS4wMTYgMTMuNzE0NCAxMTMuNTMyIDE0LjY3ODcgMTE0LjkzNSAxNi4wOTY3QzExNi4zMzkgMTcuNTI5IDExNi43MTQgMTkuNTAwMSAxMTYuNzE0IDIxLjM4NjJWMzMuODUxMUgxMTIuNTU5VjIxLjQwMDRDMTEyLjU1OSAxOC42MDY3IDExMC44OTEgMTcuNjE0MSAxMDcuODMzIDE3LjYxNDFDMTA0Ljc3NiAxNy42MTQxIDEwMy4xNSAxOC4zMDg5IDEwMy4xNSAxOC4zMDg5VjMzLjg1MTFIOTkuMDA4WiIgZmlsbD0iIzM5NzBEQiIvPgo8L3N2Zz4K');
        display: block;
        width: 124px;
        height: 48px;
    }
  `;

  SwaggerModule.setup('api', app, document, {
    customCss: customCss,
    customSiteTitle: 'IP Blocklist Service Assignment Service',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
