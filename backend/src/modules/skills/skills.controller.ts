import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Skills & Categories')
@Controller()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Public()
  @UseInterceptors(CacheInterceptor)
  @Get('categories')
@ApiOperation({ summary: 'Get all skill categories' })
@ApiResponse({ status: 200, description: 'Return list of skill categories' })
  async getCategories() {
    return this.skillsService.getCategories();
  }

  @Public()
  @UseInterceptors(CacheInterceptor)
  @Get('skills')
@ApiOperation({ summary: 'Get active skills by category or search term (searches name & aliases)' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return list of matching skills' })
  async getSkills(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.skillsService.getSkills(categoryId, search);
  }

  @Post('skills')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Create a new custom skill' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  async createSkill(@Body() body: { name: string; categoryId: string }) {
    return this.skillsService.createSkill(body.name, body.categoryId);
  }

  @Patch('skills/:id')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Update skill details (name, categoryId, type)' })
  async updateSkill(
    @Param('id') id: string,
    @Body() body: { name?: string; categoryId?: string; type?: 'HARD' | 'SOFT' },
  ) {
    return this.skillsService.updateSkill(id, body.name, body.categoryId, body.type);
  }

  @Post('skills/:id/aliases')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Add an alias to a skill' })
  async addSkillAlias(
    @Param('id') id: string,
    @Body() body: { aliasName: string },
  ) {
    return this.skillsService.addSkillAlias(id, body.aliasName);
  }

  @Delete('skills/aliases/:aliasId')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Delete a skill alias' })
  async deleteSkillAlias(@Param('aliasId') aliasId: string) {
    return this.skillsService.deleteSkillAlias(aliasId);
  }

  // --- UNRECOGNIZED SKILLS (ADMIN) ---

  @Public()
  @Get('skills/unrecognized')
  @ApiOperation({ summary: 'Get unrecognized skills pending review' })
  async getUnrecognizedSkills() {
    return this.skillsService.getUnrecognizedSkills();
  }

  @Post('skills/unrecognized/:id/map')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Map unrecognized skill to an existing skill as an alias' })
  async mapUnrecognizedSkill(
    @Param('id') id: string,
    @Body() body: { targetSkillId: string },
  ) {
    return this.skillsService.mapUnrecognizedSkill(id, body.targetSkillId);
  }

  @Post('skills/unrecognized/:id/approve')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Approve unrecognized skill as a new skill' })
  async approveUnrecognizedSkill(
    @Param('id') id: string,
    @Body() body: { categoryId: string },
  ) {
    return this.skillsService.approveUnrecognizedSkill(id, body.categoryId);
  }

  @Delete('skills/unrecognized/:id')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Reject unrecognized skill' })
  async rejectUnrecognizedSkill(@Param('id') id: string) {
    return this.skillsService.rejectUnrecognizedSkill(id);
  }
}
