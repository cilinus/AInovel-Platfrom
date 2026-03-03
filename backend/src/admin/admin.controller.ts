import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @Roles('admin')
  @ApiOperation({ summary: '관리자 대시보드 통계' })
  async getDashboard() {
    // TODO: Implement dashboard stats aggregation
    return { message: 'Admin dashboard - to be implemented' };
  }
}
