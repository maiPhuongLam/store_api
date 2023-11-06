import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ResponseInterceptor } from './response/response.interceptor';
import configuration from './config/configuration';
import * as cookieParser from 'cookie-parser';
import { raw, Request, Response, NextFunction } from 'express';
import { ValidationPipe } from '@nestjs/common';
import * as csurf from 'csurf';
import { LoggerInterceptor } from './logger.interceptor';
const ROOT_IGNORE_LIST = ['/api/v1/orders/webhook'];
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    next();
  });
  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
  });
  app.use(cookieParser());
  app.use('/api/v1/orders/webhook', raw({ type: '*/*' }));
  const csrfMiddleware = csurf({
    cookie: true,
  });

  app.use(
    '/api/v1/csrf-token',
    (req: Request, res: Response, next: NextFunction) => {
      if (ROOT_IGNORE_LIST.includes(req.url)) {
        next();
      } else {
        csrfMiddleware(req, res, next);
      }
    },
  );

  app.setGlobalPrefix(configuration().appPrefix);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(new LoggerInterceptor());
  app.enableCors({
    origin: '*',
  });
  await app.listen(configuration().port);
  console.log(`server is running on ${configuration().port}`);
}
bootstrap();
