import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { S3Module } from '../s3/s3.module';
import { SequenceService } from './services/sequence.service';
import { ManpowerRequisitionService } from './services/manpower-requisition.service';
import { JobRequisitionService } from './services/job-requisition.service';
import { CandidateApplicationService } from './services/candidate-application.service';
import { CandidateActivityService } from './services/candidate-activity.service';
import { InterviewRoundService } from './services/interview-round.service';
import { InterviewService } from './services/interview.service';
import { ScorecardService } from './services/scorecard.service';
import { JobOfferService } from './services/job-offer.service';
import { CandidateConversionService } from './services/candidate-conversion.service';

import { ManpowerRequisitionController } from './controllers/manpower-requisition.controller';
import { JobRequisitionController } from './controllers/job-requisition.controller';
import { PublicCareerController } from './controllers/public-career.controller';
import { CandidateApplicationController } from './controllers/candidate-application.controller';
import { InterviewRoundController } from './controllers/interview-round.controller';
import { InterviewController } from './controllers/interview.controller';
import { ScorecardController } from './controllers/scorecard.controller';
import { CandidateTimelineController } from './controllers/candidate-timeline.controller';
import { JobOfferController } from './controllers/job-offer.controller';

@Module({
  imports: [PrismaModule, AuditModule, S3Module],
  controllers: [
    ManpowerRequisitionController,
    JobRequisitionController,
    PublicCareerController,
    CandidateApplicationController,
    InterviewRoundController,
    InterviewController,
    ScorecardController,
    CandidateTimelineController,
    JobOfferController,
  ],
  providers: [
    SequenceService,
    ManpowerRequisitionService,
    JobRequisitionService,
    CandidateApplicationService,
    CandidateActivityService,
    InterviewRoundService,
    InterviewService,
    ScorecardService,
    JobOfferService,
    CandidateConversionService,
  ],
  exports: [
    ManpowerRequisitionService,
    JobRequisitionService,
    CandidateApplicationService,
    CandidateActivityService,
    InterviewRoundService,
    InterviewService,
    ScorecardService,
    JobOfferService,
    CandidateConversionService,
    SequenceService,
  ],
})
export class RecruitmentModule {}
