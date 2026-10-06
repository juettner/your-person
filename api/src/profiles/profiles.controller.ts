import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto.js';
import { CreateMemoryDto } from './dto/memory.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfilesService } from './profiles.service.js';

/**
 * Spring Boot analogy: a @RestController with @RequestMapping("/profiles").
 * The `api` prefix is added globally in main.ts.
 */
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Post()
  create(@Body() dto: CreateProfileDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.service.update(id, dto);
  }

  // --- memories: what they said ---

  @Get(':id/memories')
  listMemories(@Param('id') id: string) {
    return this.service.listMemories(id);
  }

  @Post(':id/memories')
  addMemory(@Param('id') id: string, @Body() dto: CreateMemoryDto) {
    return this.service.addMemory(id, dto);
  }

  @Delete(':id/memories/:memoryId')
  @HttpCode(204)
  deleteMemory(@Param('id') id: string, @Param('memoryId') memoryId: string) {
    return this.service.deleteMemory(id, memoryId);
  }
}
