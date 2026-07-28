import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('Skills & Categories')
@Controller()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all job categories' })
  @ApiResponse({ status: 200, description: 'Return list of job categories' })
  async getCategories() {
    return this.skillsService.getCategories();
  }

  @Get('skills')
  @ApiOperation({ summary: 'Get active skills by category or search term' })
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
  @ApiOperation({ summary: 'Create a new custom skill for a category' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  async createSkill(@Body() body: { name: string; categoryId: string }) {
    return this.skillsService.createSkill(body.name, body.categoryId);
  }
}
