import { ApiProperty } from '@nestjs/swagger';

export class RemoveLabelFromChatsDto {
  @ApiProperty({
    description: 'Array of phone numbers for which the label will be removed.',
    example: ['123456789032', '987654321233'],
    type: [String],
    isArray: true,
  })
  phones: string[];
}
