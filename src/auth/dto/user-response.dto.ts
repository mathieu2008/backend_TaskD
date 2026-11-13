import { ApiProperty } from '@nestjs/swagger';
import type { Role, User } from '../../users/user.types';

/** What the client receives. Never the raw database row: no hash, no counters. */
export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() firstNames!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() profession!: string;
  @ApiProperty({ enum: ['delegator', 'collaborator', 'admin'], isArray: true }) roles!: Role[];
  @ApiProperty() createdAt!: Date;
}

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    lastName: user.lastName,
    firstNames: user.firstNames,
    email: user.email,
    phone: user.phone,
    profession: user.profession,
    roles: user.roles,
    createdAt: user.createdAt,
  };
}