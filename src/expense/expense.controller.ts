import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { BookingExpense } from './entities/expense.entity';

@ApiTags('Expense Management')
@ApiBearerAuth('JWT-auth')
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking expense' })
  @ApiBody({ type: CreateExpenseDto })
  @ApiResponse({ status: 201, description: 'Expense created successfully', type: BookingExpense })
  createExpense(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expenseService.createExpense(createExpenseDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get overall profit and loss statistics' })
  @ApiResponse({ status: 200, description: 'Profit and loss statistics' })
  getProfitStatistics() {
    return this.expenseService.getProfitStatistics();
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get all expenses for a standard booking' })
  @ApiParam({ name: 'bookingId', description: 'Standard Booking UUID' })
  @ApiResponse({ status: 200, description: 'List of expenses for the booking', type: [BookingExpense] })
  findExpensesByBookingId(@Param('bookingId') bookingId: string) {
    return this.expenseService.findExpensesByBookingId(bookingId);
  }

  @Get('package-booking/:packageBookingId')
  @ApiOperation({ summary: 'Get all expenses for a package booking' })
  @ApiParam({ name: 'packageBookingId', description: 'Package Booking UUID' })
  @ApiResponse({ status: 200, description: 'List of expenses for the package booking', type: [BookingExpense] })
  findExpensesByPackageBookingId(@Param('packageBookingId') packageBookingId: string) {
    return this.expenseService.findExpensesByPackageBookingId(packageBookingId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing expense' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiBody({ type: UpdateExpenseDto })
  @ApiResponse({ status: 200, description: 'Expense updated successfully', type: BookingExpense })
  updateExpense(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expenseService.updateExpense(id, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense by ID' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 204, description: 'Expense deleted successfully' })
  deleteExpense(@Param('id') id: string) {
    return this.expenseService.deleteExpense(id);
  }
}
