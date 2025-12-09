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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';
import { Lead } from './entities/lead.entity';
import { LeadFollowUp } from './entities/lead-follow-up.entity';

@ApiTags('Lead Management')
@Controller('lead')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  // Lead CRUD Endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new lead',
    description:
      'Add a new lead to the system with contact details and requirements',
  })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({
    status: 201,
    description: 'Lead created successfully',
    type: Lead,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or duplicate lead',
  })
  createLead(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.createLead(createLeadDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all leads',
    description:
      'Retrieve all leads with optional filters for status, source, priority, etc.',
  })
  @ApiQuery({ type: FilterLeadDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of leads',
    type: [Lead],
  })
  findAllLeads(@Query() filterDto: FilterLeadDto) {
    return this.leadService.findAllLeads(filterDto);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get lead statistics',
    description:
      'Get overall statistics including conversion rate, lead distribution by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead statistics',
    schema: {
      example: {
        totalLeads: 150,
        newLeads: 25,
        qualifiedLeads: 40,
        convertedLeads: 50,
        lostLeads: 20,
        conversionRate: '33.33%',
        activeLeads: 95,
      },
    },
  })
  getLeadStatistics() {
    return this.leadService.getLeadStatistics();
  }

  @Get('statistics/by-source')
  @ApiOperation({
    summary: 'Get leads by source',
    description: 'Get lead distribution by source channels',
  })
  @ApiResponse({
    status: 200,
    description: 'Leads grouped by source',
    schema: {
      example: [
        { source: 'website', count: '45' },
        { source: 'phone_call', count: '30' },
        { source: 'referral', count: '25' },
      ],
    },
  })
  getLeadsBySource() {
    return this.leadService.getLeadsBySource();
  }

  @Get('follow-ups/upcoming')
  @ApiOperation({
    summary: 'Get upcoming follow-ups',
    description: 'Get leads with follow-ups scheduled in the next 7 days',
  })
  @ApiResponse({
    status: 200,
    description: 'Leads with upcoming follow-ups',
    type: [Lead],
  })
  getUpcomingFollowUps() {
    return this.leadService.getUpcomingFollowUps();
  }

  @Get('follow-ups/overdue')
  @ApiOperation({
    summary: 'Get overdue follow-ups',
    description:
      'Get leads with overdue follow-ups that need immediate attention',
  })
  @ApiResponse({
    status: 200,
    description: 'Leads with overdue follow-ups',
    type: [Lead],
  })
  getOverdueFollowUps() {
    return this.leadService.getOverdueFollowUps();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get lead by ID',
    description:
      'Retrieve detailed information about a specific lead including follow-up history',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead details',
    type: Lead,
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  findLeadById(@Param('id') id: string) {
    return this.leadService.findLeadById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update lead',
    description:
      'Update lead information including contact details, requirements, and preferences',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @ApiBody({ type: UpdateLeadDto })
  @ApiResponse({
    status: 200,
    description: 'Lead updated successfully',
    type: Lead,
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  updateLead(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadService.updateLead(id, updateLeadDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update lead status',
    description:
      'Change the status of a lead (new, contacted, qualified, converted, lost, etc.)',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @ApiBody({ type: UpdateLeadStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Lead status updated successfully',
    type: Lead,
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  updateLeadStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateLeadStatusDto,
  ) {
    return this.leadService.updateLeadStatus(id, updateStatusDto);
  }

  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Assign lead to sales representative',
    description: 'Assign a lead to a specific sales representative',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        assignedTo: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174010',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lead assigned successfully',
    type: Lead,
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  assignLead(@Param('id') id: string, @Body('assignedTo') assignedTo: string) {
    return this.leadService.assignLead(id, assignedTo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete lead',
    description: 'Permanently delete a lead and all associated follow-ups',
  })
  @ApiParam({
    name: 'id',
    description: 'Lead UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @ApiResponse({
    status: 204,
    description: 'Lead deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  deleteLead(@Param('id') id: string) {
    return this.leadService.deleteLead(id);
  }

  // Follow-up Endpoints
  @Post(':leadId/follow-ups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a follow-up',
    description:
      'Add a follow-up activity for a lead (call, email, meeting, etc.)',
  })
  @ApiParam({
    name: 'leadId',
    description: 'Lead UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @ApiBody({ type: CreateFollowUpDto })
  @ApiResponse({
    status: 201,
    description: 'Follow-up created successfully',
    type: LeadFollowUp,
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  createFollowUp(
    @Param('leadId') leadId: string,
    @Body() createFollowUpDto: CreateFollowUpDto,
  ) {
    return this.leadService.createFollowUp(leadId, createFollowUpDto);
  }

  @Get(':leadId/follow-ups')
  @ApiOperation({
    summary: 'Get follow-ups for a lead',
    description: 'Retrieve all follow-up activities for a specific lead',
  })
  @ApiParam({
    name: 'leadId',
    description: 'Lead UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @ApiResponse({
    status: 200,
    description: 'List of follow-ups',
    type: [LeadFollowUp],
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  findFollowUpsByLead(@Param('leadId') leadId: string) {
    return this.leadService.findFollowUpsByLead(leadId);
  }

  @Get('follow-ups/:followUpId')
  @ApiOperation({
    summary: 'Get follow-up by ID',
    description: 'Retrieve details of a specific follow-up activity',
  })
  @ApiParam({
    name: 'followUpId',
    description: 'Follow-up UUID',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @ApiResponse({
    status: 200,
    description: 'Follow-up details',
    type: LeadFollowUp,
  })
  @ApiResponse({
    status: 404,
    description: 'Follow-up not found',
  })
  findFollowUpById(@Param('followUpId') followUpId: string) {
    return this.leadService.findFollowUpById(followUpId);
  }
}
