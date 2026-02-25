import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; profileImage?: string },
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, data, {
      new: true,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getTokenBalance(userId: string): Promise<number> {
    const user = await this.findById(userId);
    return user.tokenBalance;
  }
}
