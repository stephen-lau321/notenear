import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
} from "class-validator";

export class CreateDemandDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  instrument?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  postTimeText?: string;

  @IsOptional()
  @IsNumber()
  hoursAgo?: number;

  @IsOptional()
  @IsNumber()
  commentCount?: number;

  @IsOptional()
  @IsObject()
  accountSignals?: Record<string, any>;

  @IsOptional()
  @IsObject()
  rawData?: Record<string, any>;
}
