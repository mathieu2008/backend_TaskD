import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trimAndLowercase = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({ example: 'jane@example.com', description: 'Email (username support comes later)' })
  @Transform(trimAndLowercase) @IsString() @IsNotEmpty() @MaxLength(254)
  identifier!: string;

  // No format rule here: login must not teach an attacker the password policy.
  @ApiProperty({ example: 'Secret123' })
  @IsString() @IsNotEmpty() @MaxLength(72)
  password!: string;
}