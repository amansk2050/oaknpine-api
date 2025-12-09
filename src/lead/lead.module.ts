import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { Lead } from './entities/lead.entity';
import { LeadFollowUp } from './entities/lead-follow-up.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, LeadFollowUp])],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
