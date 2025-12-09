import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
  createHomestay(@Body() createHomestayDto: CreateHomestayDto) {
    return this.homestayService.createHomestay(createHomestayDto);
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
  findAllHomestays() {
    return this.homestayService.findAllHomestays();
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
  findHomestayById(@Param('id') id: string) {
    return this.homestayService.findHomestayById(id);
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
  ) {
    return this.homestayService.updateHomestay(id, updateHomestayDto);
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
  deleteHomestay(@Param('id') id: string) {
    return this.homestayService.deleteHomestay(id);
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
  getHomestayStatistics(@Param('id') id: string) {
    return this.homestayService.getHomestayStatistics(id);
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
  ) {
    return this.homestayService.addRoom(homestayId, createRoomDto);
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
  findAllRoomsByHomestay(@Param('homestayId') homestayId: string) {
    return this.homestayService.findAllRoomsByHomestay(homestayId);
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
  findAvailableRooms(@Param('homestayId') homestayId: string) {
    return this.homestayService.findAvailableRooms(homestayId);
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
  findRoomById(@Param('roomId') roomId: string) {
    return this.homestayService.findRoomById(roomId);
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
  ) {
    return this.homestayService.updateRoom(roomId, updateRoomDto);
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
  deleteRoom(@Param('roomId') roomId: string) {
    return this.homestayService.deleteRoom(roomId);
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
  ) {
    return this.homestayService.blockRoom(roomId, blockRoomDto);
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
  unblockRoom(@Param('roomId') roomId: string) {
    return this.homestayService.unblockRoom(roomId);
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
  ) {
    return this.homestayService.updateRoomPricing(roomId, updatePricingDto);
  }
}
