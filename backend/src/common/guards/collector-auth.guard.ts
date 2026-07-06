import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class CollectorAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];
    const validKey = process.env.COLLECTOR_API_KEY || "street-music-collector-dev";

    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException("Invalid collector API key");
    }
    return true;
  }
}
