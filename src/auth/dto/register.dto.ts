import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { Equals, IsEmail, IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { PASSWORD_REGEX, PHONE_REGEX } from '../../users/validation-rules';
import { REGISTRABLE_ROLES, type RegistrableRole } from '../../users/user.types';

const trim = ({ value }: TransformFnParams): unknown => (typeof value === 'string' ? value.trim() : value);
const trimAndLowercase = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const removeSpaces = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.replace(/\s+/g, '') : value;

export class RegisterDto {
  @ApiProperty({ example: 'Doe' })
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'Jane Marie' })
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100)
  firstNames!: string;

  @ApiProperty({ example: '+22901020304', description: 'International format' })
  @Transform(removeSpaces) @Matches(PHONE_REGEX, { message: 'Phone must be in international format (+229...)' })
  phone!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @Transform(trimAndLowercase) @IsEmail() @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'Web designer' })
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100)
  profession!: string;

  @ApiProperty({ example: 'Secret123', description: '8+ characters, at least one letter and one digit' })
  @IsString() // never trimmed: spaces may be part of a password
  @Matches(PASSWORD_REGEX, { message: 'Password must have 8 to 72 characters, with at least one letter and one digit' })
  password!: string;

  @ApiProperty({ example: true })
  @Equals(true, { message: 'The terms of use must be accepted' })
  acceptTerms!: boolean;

  @ApiProperty({ enum: REGISTRABLE_ROLES })
  @IsIn(REGISTRABLE_ROLES)
  role!: RegistrableRole;
}