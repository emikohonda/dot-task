import { IsISO8601, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateScheduleDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsISO8601()
    date!: string;

    @IsUUID()
    siteId!: string;
}