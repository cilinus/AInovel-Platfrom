import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface GenerationRequest {
  workId: string;
  userId: string;
  genre: string;
  prompt: string;
  previousContext?: string;
}

@Injectable()
export class AIService {
  constructor(
    @InjectQueue('ai-generation') private aiQueue: Queue,
  ) {}

  async requestGeneration(request: GenerationRequest) {
    const job = await this.aiQueue.add('generate-episode', request, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    return { jobId: job.id };
  }

  async getJobStatus(jobId: string) {
    const job = await this.aiQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      id: job.id,
      state,
      progress: job.progress,
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  }
}
