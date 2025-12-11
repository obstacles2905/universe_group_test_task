import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Desk lamp' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  price!: number;
}

