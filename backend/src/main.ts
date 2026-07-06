import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  // CORS — allow localhost, LAN IPs, and GitHub Pages
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman, etc.)
      if (!origin) return callback(null, true);

      const allowed = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:5181",
        "https://stephen-lau321.github.io",
      ];

      if (allowed.includes(origin)) return callback(null, true);

      // Allow any LAN IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      if (
        /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }

      callback(null, true); // In dev, allow all. In prod, change to: callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // Global prefix
  app.setGlobalPrefix("api");

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle("乐邻 API")
    .setDescription("音乐社交活动平台接口文档")
    .setVersion("1.1")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API docs: http://localhost:${port}/api/docs`);
}
bootstrap();
