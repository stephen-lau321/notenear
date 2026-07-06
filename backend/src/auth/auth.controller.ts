import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("认证")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "邮箱注册" })
  register(@Body() data: { email: string; password: string; role?: string }) {
    return this.authService.register(data.email, data.password, data.role);
  }

  @Post("login")
  @ApiOperation({ summary: "邮箱登录" })
  login(@Body() data: { email: string; password: string }) {
    return this.authService.login(data.email, data.password);
  }

  @Post("phone/login")
  @ApiOperation({ summary: "手机号登录（兼容旧版）" })
  phoneLogin(@Body() data: { phone: string; code: string }) {
    return this.authService.phoneLogin(data.phone, data.code);
  }

  @Post("neighbor/register")
  @ApiOperation({ summary: "邻居注册" })
  neighborRegister(@Body() data: any) {
    return this.authService.neighborRegister(data);
  }
}
