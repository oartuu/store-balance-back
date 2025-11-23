import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import  cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    app.use(cookieParser());

    app.enableCors({
    origin: "http://localhost:3000", // permite qualquer domínio (em produção, troque pelo domínio do front)
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // se for enviar cookies ou auth
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on port: ${process.env.PORT}`);
}
bootstrap();
