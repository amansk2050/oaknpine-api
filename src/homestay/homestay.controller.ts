import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { HomestayService } from './homestay.service';
import { CreateHomestayDto } from './dto/create-homestay.dto';
import { UpdateHomestayDto } from './dto/update-homestay.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { BlockRoomDto } from './dto/block-room.dto';
import { UpdateRoomPricingDto } from './dto/update-room-pricing.dto';
import { Homestay } from './entities/homestay.entity';
import { Room } from './entities/room.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BetterAuthUser } from '../auth/better-auth.service';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@ApiTags('Homestay Management')
@Controller('homestay')
export class HomestayController {
  constructor(private readonly homestayService: HomestayService) {}

  // Homestay Endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new homestay',
    description: 'Add a new homestay property to the system with all details',
  })
  @ApiBody({ type: CreateHomestayDto })
  @ApiResponse({
    status: 201,
    description: 'Homestay created successfully',
    type: Homestay,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  createHomestay(
    @Body() createHomestayDto: CreateHomestayDto,
    @CurrentUser() user: BetterAuthUser,
    @CurrentTenant() tenantId: string,
  ) {
    if (user && !createHomestayDto.ownerId) {
      createHomestayDto.ownerId = user.id;
    }
    return this.homestayService.createHomestay(createHomestayDto, tenantId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all homestays',
    description: 'Retrieve a list of all homestays with their rooms',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all homestays',
    type: [Homestay],
  })
  findAllHomestays(@CurrentTenant() tenantId: string) {
    return this.homestayService.findAllHomestays(tenantId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get homestay by ID',
    description:
      'Retrieve detailed information about a specific homestay including all rooms',
  })
  @ApiParam({
    name: 'id',
    description: 'Homestay UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Homestay details',
    type: Homestay,
  })
  @ApiResponse({
    status: 404,
    description: 'Homestay not found',
  })
  findHomestayById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.findHomestayById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update homestay',
    description:
      'Update homestay information including status, amenities, and contact details',
  })
  @ApiParam({
    name: 'id',
    description: 'Homestay UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateHomestayDto })
  @ApiResponse({
    status: 200,
    description: 'Homestay updated successfully',
    type: Homestay,
  })
  @ApiResponse({
    status: 404,
    description: 'Homestay not found',
  })
  updateHomestay(
    @Param('id') id: string,
    @Body() updateHomestayDto: UpdateHomestayDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.updateHomestay(id, updateHomestayDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete homestay',
    description: 'Permanently delete a homestay and all its associated rooms',
  })
  @ApiParam({
    name: 'id',
    description: 'Homestay UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Homestay deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Homestay not found',
  })
  deleteHomestay(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.deleteHomestay(id, tenantId);
  }

  @Get(':id/statistics')
  @ApiOperation({
    summary: 'Get homestay statistics',
    description:
      'Get detailed statistics including total rooms, view/non-view rooms, availability, and capacity',
  })
  @ApiParam({
    name: 'id',
    description: 'Homestay UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Homestay statistics',
    schema: {
      example: {
        homestay: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Mountain View Homestay',
        },
        totalRooms: 10,
        viewRooms: 6,
        nonViewRooms: 4,
        availableRooms: 8,
        blockedRooms: 2,
        totalCapacity: 30,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Homestay not found',
  })
  getHomestayStatistics(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.getHomestayStatistics(id, tenantId);
  }

  // Room Endpoints
  @Post(':homestayId/rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a new room',
    description:
      'Add a new room to a homestay with capacity, pricing, and type details',
  })
  @ApiParam({
    name: 'homestayId',
    description: 'Homestay UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({
    status: 201,
    description: 'Room created successfully',
    type: Room,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or duplicate room number',
  })
  @ApiResponse({
    status: 404,
    description: 'Homestay not found',
  })
  addRoom(
    @Param('homestayId') homestayId: string,
    @Body() createRoomDto: CreateRoomDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.addRoom(homestayId, createRoomDto, tenantId);
  }

  @Get(':homestayId/rooms')
  @ApiOperation({
    summary: 'Get all rooms in a homestay',
    description: 'Retrieve all rooms for a specific homestay',
  })
  @ApiParam({
    name: 'homestayId',
    description: 'Homestay UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of rooms',
    type: [Room],
  })
  @ApiResponse({
    status: 404,
    description: 'Homestay not found',
  })
  findAllRoomsByHomestay(
    @Param('homestayId') homestayId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.findAllRoomsByHomestay(homestayId, tenantId);
  }

  @Get(':homestayId/rooms/available')
  @ApiOperation({
    summary: 'Get available rooms',
    description:
      'Retrieve all currently available rooms for booking in a homestay',
  })
  @ApiParam({
    name: 'homestayId',
    description: 'Homestay UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available rooms',
    type: [Room],
  })
  @ApiResponse({
    status: 404,
    description: 'Homestay not found',
  })
  findAvailableRooms(
    @Param('homestayId') homestayId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.findAvailableRooms(homestayId, tenantId);
  }

  @Get('rooms/:roomId')
  @ApiOperation({
    summary: 'Get room by ID',
    description: 'Retrieve detailed information about a specific room',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @ApiResponse({
    status: 200,
    description: 'Room details',
    type: Room,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  findRoomById(
    @Param('roomId') roomId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.findRoomById(roomId, tenantId);
  }

  @Put('rooms/:roomId')
  @ApiOperation({
    summary: 'Update room',
    description:
      'Update room information including capacity, pricing, amenities, and type',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @ApiBody({ type: UpdateRoomDto })
  @ApiResponse({
    status: 200,
    description: 'Room updated successfully',
    type: Room,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  updateRoom(
    @Param('roomId') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.updateRoom(roomId, updateRoomDto, tenantId);
  }

  @Delete('rooms/:roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete room',
    description: 'Permanently delete a room from the homestay',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @ApiResponse({
    status: 204,
    description: 'Room deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  deleteRoom(
    @Param('roomId') roomId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.deleteRoom(roomId, tenantId);
  }

  @Patch('rooms/:roomId/block')
  @ApiOperation({
    summary: 'Block a room',
    description:
      'Block a room from being available for booking with optional date range',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @ApiBody({ type: BlockRoomDto })
  @ApiResponse({
    status: 200,
    description: 'Room blocked successfully',
    type: Room,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  blockRoom(
    @Param('roomId') roomId: string,
    @Body() blockRoomDto: BlockRoomDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.blockRoom(roomId, blockRoomDto, tenantId);
  }

  @Patch('rooms/:roomId/unblock')
  @ApiOperation({
    summary: 'Unblock a room',
    description: 'Make a blocked room available for booking again',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @ApiResponse({
    status: 200,
    description: 'Room unblocked successfully',
    type: Room,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  unblockRoom(
    @Param('roomId') roomId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.unblockRoom(roomId, tenantId);
  }

  @Patch('rooms/:roomId/pricing')
  @ApiOperation({
    summary: 'Update room pricing',
    description: 'Update the per-head per-day price for a room',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Room UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @ApiBody({ type: UpdateRoomPricingDto })
  @ApiResponse({
    status: 200,
    description: 'Room pricing updated successfully',
    type: Room,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  updateRoomPricing(
    @Param('roomId') roomId: string,
    @Body() updatePricingDto: UpdateRoomPricingDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.homestayService.updateRoomPricing(roomId, updatePricingDto, tenantId);
  }

  /* ─── Public Endpoints ─── */

  @Public()
  @Get('public/:slug')
  @ApiOperation({
    summary: 'Get public homestay profile by slug',
    description:
      'Retrieve general homestay info and its room details safely without guest info.',
  })
  @ApiParam({ name: 'slug', description: 'Unique public slug of the homestay' })
  @ApiResponse({ status: 200, description: 'Return public profile details.' })
  @ApiResponse({ status: 404, description: 'Homestay not found.' })
  getPublicProfile(@Param('slug') slug: string) {
    return this.homestayService.getPublicProfile(slug);
  }

  @Public()
  @Get('public/:slug/availability')
  @ApiOperation({
    summary: 'Check room availability publicly by slug',
    description:
      'Returns available/booked status of each room without displaying sensitive guest bookings.',
  })
  @ApiParam({ name: 'slug', description: 'Unique public slug of the homestay' })
  @ApiResponse({
    status: 200,
    description: 'Return list of rooms with their availability status.',
  })
  @ApiResponse({ status: 404, description: 'Homestay not found.' })
  getPublicAvailability(
    @Param('slug') slug: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
  ) {
    return this.homestayService.getPublicAvailability(
      slug,
      checkInDate,
      checkOutDate,
    );
  }
}
