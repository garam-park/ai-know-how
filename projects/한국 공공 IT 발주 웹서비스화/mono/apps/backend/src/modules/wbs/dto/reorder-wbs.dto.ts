import { IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItem {
  @IsInt()
  nodeId: number;

  @IsInt()
  order: number;

  @IsOptional()
  @IsInt()
  parentId?: number;
}

export class ReorderWbsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  orders: ReorderItem[];
}
