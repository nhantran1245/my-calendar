import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_PREFIX, DEFAULT_PORT } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix(API_PREFIX);
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('My Calendar API')
    .setDescription('Personal calendar REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);

  const port = process.env.PORT ?? DEFAULT_PORT;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/${API_PREFIX}`);
}

bootstrap();
