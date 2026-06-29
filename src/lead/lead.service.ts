import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import {
  LeadFollowUp,
  FollowUpOutcome,
} from './entities/lead-follow-up.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(LeadFollowUp)
    private followUpRepository: Repository<LeadFollowUp>,
  ) {}

  // Lead CRUD Operations
  async createLead(createLeadDto: CreateLeadDto, tenantId?: string): Promise<Lead> {
    if (!tenantId) {
      const [firstOrg] = await this.leadRepository.query(
        `SELECT id FROM organization LIMIT 1`,
      );
      tenantId = firstOrg?.id;
    }

    // Check for duplicate email or phone within the same organization
    const existingLead = await this.leadRepository.findOne({
      where: [
        { email: createLeadDto.email, organizationId: tenantId },
        { phone: createLeadDto.phone, organizationId: tenantId },
      ],
    });

    if (existingLead) {
      throw new BadRequestException(
        'Lead with this email or phone already exists',
      );
    }

    const lead = this.leadRepository.create({
      ...createLeadDto,
      organizationId: tenantId,
      checkInDate: createLeadDto.checkInDate
        ? new Date(createLeadDto.checkInDate)
        : null,
      checkOutDate: createLeadDto.checkOutDate
        ? new Date(createLeadDto.checkOutDate)
        : null,
      status: LeadStatus.NEW,
    });

    return await this.leadRepository.save(lead);
  }

  async findAllLeads(filterDto: FilterLeadDto, tenantId: string): Promise<Lead[]> {
    const query = this.leadRepository.createQueryBuilder('lead');

    query.andWhere('lead.organizationId = :tenantId', { tenantId });

    if (filterDto?.status) {
      query.andWhere('lead.status = :status', { status: filterDto.status });
    }

    if (filterDto?.source) {
      query.andWhere('lead.source = :source', { source: filterDto.source });
    }

    if (filterDto?.priority) {
      query.andWhere('lead.priority = :priority', {
        priority: filterDto.priority,
      });
    }

    if (filterDto?.leadType) {
      query.andWhere('lead.leadType = :leadType', {
        leadType: filterDto.leadType,
      });
    }

    if (filterDto?.assignedTo) {
      query.andWhere('lead.assignedTo = :assignedTo', {
        assignedTo: filterDto.assignedTo,
      });
    }

    if (filterDto?.createdAfter) {
      query.andWhere('lead.createdAt >= :createdAfter', {
        createdAfter: new Date(filterDto.createdAfter),
      });
    }

    if (filterDto?.createdBefore) {
      query.andWhere('lead.createdAt <= :createdBefore', {
        createdBefore: new Date(filterDto.createdBefore),
      });
    }

    return await query
      .leftJoinAndSelect('lead.followUps', 'followUps')
      .orderBy('lead.createdAt', 'DESC')
      .getMany();
  }

  async findLeadById(id: string, tenantId: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id, organizationId: tenantId },
      relations: ['followUps'],
      order: { followUps: { createdAt: 'DESC' } },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async updateLead(
    id: string,
    updateLeadDto: UpdateLeadDto,
    tenantId: string,
  ): Promise<Lead> {
    const lead = await this.findLeadById(id, tenantId);

    // Update dates if provided
    if (updateLeadDto.checkInDate) {
      lead.checkInDate = new Date(updateLeadDto.checkInDate);
    }
    if (updateLeadDto.checkOutDate) {
      lead.checkOutDate = new Date(updateLeadDto.checkOutDate);
    }
    if (updateLeadDto.nextFollowUpAt) {
      lead.nextFollowUpAt = new Date(updateLeadDto.nextFollowUpAt);
    }

    Object.assign(lead, updateLeadDto);
    return await this.leadRepository.save(lead);
  }

  async updateLeadStatus(
    id: string,
    updateStatusDto: UpdateLeadStatusDto,
    tenantId: string,
  ): Promise<Lead> {
    const lead = await this.findLeadById(id, tenantId);

    lead.status = updateStatusDto.status;

    // Handle conversion
    if (updateStatusDto.status === LeadStatus.CONVERTED) {
      lead.convertedAt = new Date();
      if (updateStatusDto.bookingId) {
        lead.bookingId = updateStatusDto.bookingId;
      }
    }

    // Handle lost lead
    if (
      updateStatusDto.status === LeadStatus.LOST &&
      updateStatusDto.lostReason
    ) {
      lead.lostReason = updateStatusDto.lostReason;
    }

    // Add status change note
    if (updateStatusDto.reason) {
      lead.notes = lead.notes
        ? `${lead.notes}\n\n[${new Date().toISOString()}] Status changed to ${updateStatusDto.status}: ${updateStatusDto.reason}`
        : `[${new Date().toISOString()}] Status changed to ${updateStatusDto.status}: ${updateStatusDto.reason}`;
    }

    return await this.leadRepository.save(lead);
  }

  async deleteLead(id: string, tenantId: string): Promise<void> {
    const lead = await this.findLeadById(id, tenantId);
    await this.leadRepository.delete(lead.id);
  }

  async assignLead(
    id: string,
    assignedTo: string,
    tenantId: string,
  ): Promise<Lead> {
    const lead = await this.findLeadById(id, tenantId);
    lead.assignedTo = assignedTo;
    return await this.leadRepository.save(lead);
  }

  // Follow-up Operations
  async createFollowUp(
    leadId: string,
    createFollowUpDto: CreateFollowUpDto,
    tenantId: string,
  ): Promise<LeadFollowUp> {
    // Check ownership of lead
    const lead = await this.leadRepository.findOne({
      where: { id: leadId, organizationId: tenantId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    // Create follow-up WITHOUT spreading the DTO, set fields explicitly
    const followUp = this.followUpRepository.create({
      type: createFollowUpDto.type,
      outcome: createFollowUpDto.outcome,
      notes: createFollowUpDto.notes,
      durationMinutes: createFollowUpDto.durationMinutes,
      followUpDate: createFollowUpDto.followUpDate
        ? new Date(createFollowUpDto.followUpDate)
        : new Date(),
      nextFollowUpDate: createFollowUpDto.nextFollowUpDate
        ? new Date(createFollowUpDto.nextFollowUpDate)
        : null,
      performedBy: createFollowUpDto.performedBy,
      lead: lead, // Set the relation, TypeORM will handle leadId
    });

    const savedFollowUp = await this.followUpRepository.save(followUp);

    // Update lead's last contacted and next follow-up dates
    lead.lastContactedAt = savedFollowUp.followUpDate;
    if (savedFollowUp.nextFollowUpDate) {
      lead.nextFollowUpAt = savedFollowUp.nextFollowUpDate;
    }

    // Update lead status based on outcome
    if (createFollowUpDto.outcome === FollowUpOutcome.INTERESTED) {
      lead.status = LeadStatus.QUALIFIED;
    } else if (createFollowUpDto.outcome === FollowUpOutcome.NOT_INTERESTED) {
      lead.status = LeadStatus.LOST;
    } else if (
      createFollowUpDto.outcome === FollowUpOutcome.BOOKING_CONFIRMED
    ) {
      lead.status = LeadStatus.CONVERTED;
      lead.convertedAt = new Date();
    }

    await this.leadRepository.save(lead);

    return savedFollowUp;
  }

  async findFollowUpsByLead(leadId: string, tenantId: string): Promise<LeadFollowUp[]> {
    await this.findLeadById(leadId, tenantId);
    return await this.followUpRepository.find({
      where: { leadId },
      order: { followUpDate: 'DESC' },
    });
  }

  async findFollowUpById(followUpId: string, tenantId: string): Promise<LeadFollowUp> {
    const followUp = await this.followUpRepository.findOne({
      where: { id: followUpId },
      relations: ['lead'],
    });

    if (!followUp || followUp.lead?.organizationId !== tenantId) {
      throw new NotFoundException(`Follow-up with ID ${followUpId} not found`);
    }

    return followUp;
  }

  // Statistics and Analytics
  async getLeadStatistics(tenantId: string) {
    const totalLeads = await this.leadRepository.count({
      where: { organizationId: tenantId },
    });
    const newLeads = await this.leadRepository.count({
      where: { status: LeadStatus.NEW, organizationId: tenantId },
    });
    const qualifiedLeads = await this.leadRepository.count({
      where: { status: LeadStatus.QUALIFIED, organizationId: tenantId },
    });
    const convertedLeads = await this.leadRepository.count({
      where: { status: LeadStatus.CONVERTED, organizationId: tenantId },
    });
    const lostLeads = await this.leadRepository.count({
      where: { status: LeadStatus.LOST, organizationId: tenantId },
    });

    const conversionRate =
      totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      conversionRate: `${conversionRate}%`,
      activeLeads: totalLeads - convertedLeads - lostLeads,
    };
  }

  async getLeadsBySource(tenantId: string) {
    const result = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .where('lead.organizationId = :tenantId', { tenantId })
      .groupBy('lead.source')
      .getRawMany();

    return result;
  }

  async getUpcomingFollowUps(tenantId: string): Promise<Lead[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return await this.leadRepository.find({
      where: {
        nextFollowUpAt: Between(today, nextWeek),
        status: LeadStatus.QUALIFIED || LeadStatus.CONTACTED,
        organizationId: tenantId,
      },
      order: { nextFollowUpAt: 'ASC' },
    });
  }

  async getOverdueFollowUps(tenantId: string): Promise<Lead[]> {
    const today = new Date();

    return await this.leadRepository.find({
      where: {
        nextFollowUpAt: LessThanOrEqual(today),
        status: LeadStatus.QUALIFIED || LeadStatus.CONTACTED,
        organizationId: tenantId,
      },
      order: { nextFollowUpAt: 'ASC' },
    });
  }
}
