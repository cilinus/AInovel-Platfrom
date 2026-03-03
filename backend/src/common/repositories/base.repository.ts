import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { Logger } from '@nestjs/common';

export abstract class BaseRepository<T extends Document> {
  protected readonly logger: Logger;

  constructor(
    protected readonly model: Model<T>,
    contextName: string,
  ) {
    this.logger = new Logger(contextName);
  }

  async findById(id: string): Promise<T | null> {
    this.logger.debug(`findById: ${id}`);
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    this.logger.debug(`findOne: ${JSON.stringify(filter)}`);
    return this.model.findOne(filter).exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    options?: { sort?: Record<string, 1 | -1>; skip?: number; limit?: number; select?: string },
  ): Promise<T[]> {
    this.logger.debug(`find: ${JSON.stringify(filter)} options=${JSON.stringify(options)}`);
    let query = this.model.find(filter);
    if (options?.sort) query = query.sort(options.sort);
    if (options?.skip) query = query.skip(options.skip);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.select) query = query.select(options.select);
    return query.exec();
  }

  async create(data: Partial<T>): Promise<T> {
    this.logger.debug(`create: ${JSON.stringify(data)}`);
    return this.model.create(data as any);
  }

  async update(id: string, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    this.logger.debug(`update: id=${id} data=${JSON.stringify(data)}`);
    return this.model.findByIdAndUpdate(id, data, { new: true, ...options }).exec();
  }

  async delete(id: string): Promise<T | null> {
    this.logger.debug(`delete: ${id}`);
    return this.model.findByIdAndDelete(id).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    this.logger.debug(`count: ${JSON.stringify(filter)}`);
    return this.model.countDocuments(filter).exec();
  }
}
