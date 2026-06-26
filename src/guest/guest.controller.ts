import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { FilterGuestDto } from './dto/filter-guest.dto';
import { Guest } from './entities/guest.entity';

@ApiTags('Guest CRM')
@ApiBearerAuth('JWT-auth')
@Controller('guest')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  /* ── Create ─────────────────────────────────────────────────────────── */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a direct guest (walk-in)',
    description:
      'Manually add a guest without requiring a prior lead or inquiry. Covers TC-20.',
  })
  @ApiBody({ type: CreateGuestDto })
  @ApiResponse({ status: 201, description: 'Guest created', type: Guest })
  createGuest(@Body() dto: CreateGuestDto) {
    return this.guestService.createGuest(dto);
  }

  /* ── List all ────────────────────────────────────────────────────────── */
  @Get()
  @ApiOperation({
    summary: 'Get all guests',
    description:
      'Filter by source (lead vs direct), search by name/phone, or filter by email status. Covers TC-21, TC-24.',
  })
  @ApiQuery({ type: FilterGuestDto, required: false })
  @ApiResponse({ status: 200, description: 'List of guests', type: [Guest] })
  findAllGuests(@Query() filterDto: FilterGuestDto) {
    return this.guestService.findAllGuests(filterDto);
  }

  /* ── Statistics ──────────────────────────────────────────────────────── */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get guest statistics',
    description:
      'Returns total guests broken down by source (walk-in, lead-converted, B2B).',
  })
  @ApiResponse({
    status: 200,
    description: 'Guest statistics',
    schema: {
      example: { total: 100, walkIn: 30, fromLead: 60, fromB2b: 10 },
    },
  })
  getGuestStats() {
    return this.guestService.getGuestStats();
  }

  /* ── Email Delivery Report (TC-24) ───────────────────────────────────── */
  @Get('email-report')
  @ApiOperation({
    summary: 'Email delivery tracking report',
    description:
      'Lists guests who have and have not received booking confirmation emails. Covers TC-24.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email delivery report grouped by status',
    schema: {
      example: {
        summary: { sent: 70, notSent: 25, failed: 5 },
        sent: [],
        notSent: [],
        failed: [],
      },
    },
  })
  getEmailDeliveryReport() {
    return this.guestService.getEmailDeliveryReport();
  }

  /* ── Get one ─────────────────────────────────────────────────────────── */
  @Get(':id')
  @ApiOperation({ summary: 'Get guest by ID' })
  @ApiParam({ name: 'id', description: 'Guest UUID' })
  @ApiResponse({ status: 200, description: 'Guest details', type: Guest })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  findGuestById(@Param('id') id: string) {
    return this.guestService.findGuestById(id);
  }

  /* ── Update ──────────────────────────────────────────────────────────── */
  @Put(':id')
  @ApiOperation({ summary: 'Update guest information' })
  @ApiParam({ name: 'id', description: 'Guest UUID' })
  @ApiBody({ type: UpdateGuestDto })
  @ApiResponse({ status: 200, description: 'Guest updated', type: Guest })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  updateGuest(@Param('id') id: string, @Body() dto: UpdateGuestDto) {
    return this.guestService.updateGuest(id, dto);
  }

  /* ── Delete ──────────────────────────────────────────────────────────── */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a guest record' })
  @ApiParam({ name: 'id', description: 'Guest UUID' })
  @ApiResponse({ status: 204, description: 'Guest deleted' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  deleteGuest(@Param('id') id: string) {
    return this.guestService.deleteGuest(id);
  }
}
