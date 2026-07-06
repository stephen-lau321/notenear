import { Controller, Get, Post, Body, Query, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

@ApiTags("地图/位置")
@Controller({ path: "map", version: "1" })
export class MapController {
  private readonly logger = new Logger(MapController.name);
  private readonly amapKey: string;

  constructor(private config: ConfigService) {
    this.amapKey = this.config.get("AMAP_API_KEY") || "";
  }

  @Post("geocode")
  @ApiOperation({ summary: "逆地理编码（经纬度→地址）" })
  async geocode(@Body("lat") lat: number, @Body("lng") lng: number) {
    if (!lat || !lng) {
      return { error: "请提供经纬度" };
    }

    // Try real AMAP API via fetch (Node 18+)
    try {
      const url = `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&key=${this.amapKey}&radius=200&extensions=base`;
      const response = await fetch(url);
      const data = await response.json() as any;
      
      if (data.status === "1" && data.regeocode) {
        const addr = data.regeocode.addressComponent;
        return {
          province: addr.province || "",
          city: addr.city || addr.province || "",
          district: addr.district || "",
          street: addr.streetNumber?.street || "",
          streetNumber: addr.streetNumber?.number || "",
          formatted: data.regeocode.formatted_address || "",
        };
      }
    } catch (err) {
      this.logger.warn(`AMAP geocode call failed (will use mock): ${err instanceof Error ? err.message : err}`);
    }

    // Fallback to mock
    return {
      province: "广东省",
      city: "广州市", 
      district: "天河区",
      street: "体育西路",
      streetNumber: "100号",
      formatted: "广东省广州市天河区体育西路100号",
    };
  }

  @Get("streets")
  @ApiOperation({ summary: "搜索街道（根据区名）" })
  async searchStreets(@Query("district") district: string) {
    if (!district) return [];
    try {
      const url = `https://restapi.amap.com/v3/assistant/inputtips?keywords=${encodeURIComponent(district + " 路 街 大道")}&key=${this.amapKey}&type=190301`;
      const response = await fetch(url);
      const data = await response.json() as any;
      if (data.status === "1" && Array.isArray(data.tips)) {
        return data.tips.map((t: any) => ({ name: t.name })).filter((t: any) => t.name !== district);
      }
    } catch {}
    return [];
  }

  @Get("communities")
  @ApiOperation({ summary: "搜索小区（根据街道名）" })
  async searchCommunities(@Query("street") street: string, @Query("district") district?: string) {
    if (!street) return [];
    try {
      const url = `https://restapi.amap.com/v3/assistant/inputtips?keywords=${encodeURIComponent(street + " 小区")}&key=${this.amapKey}&type=120300`;
      const response = await fetch(url);
      const data = await response.json() as any;
      if (data.status === "1" && Array.isArray(data.tips)) {
        return data.tips.map((t: any) => ({ name: t.name, address: t.address }));
      }
    } catch {}
    return [];
  }

  @Get("autocomplete")
  @ApiOperation({ summary: "地址输入提示" })
  async autocomplete(@Query("keyword") keyword: string) {
    if (!keyword) return [];
    
    try {
      const url = `https://restapi.amap.com/v3/assistant/inputtips?keywords=${encodeURIComponent(keyword)}&key=${this.amapKey}&type=190300`;
      const response = await fetch(url);
      const data = await response.json() as any;
      
      if (data.status === "1" && Array.isArray(data.tips)) {
        return data.tips.map((t: any) => ({
          name: t.name,
          district: t.district,
          address: t.address,
          lat: t.location?.split(",")[1],
          lng: t.location?.split(",")[0],
        }));
      }
    } catch (err) {
      this.logger.warn(`AMAP autocomplete failed (will use mock): ${err instanceof Error ? err.message : err}`);
    }

    // Fallback to mock
    const mockResults = [
      { name: `${keyword}路`, district: "天河区" },
      { name: `${keyword}街道`, district: "越秀区" },
    ];
    return mockResults;
  }
}
