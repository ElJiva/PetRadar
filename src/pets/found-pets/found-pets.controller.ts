import { Body, Controller, Get, Post } from '@nestjs/common';
import { FoundPetsService } from './found-pets.service';
import type { FoundPetCDto } from 'src/core/models/found-pet.model';
import { logger } from 'src/config/logger';

@Controller('found-pets')
export class FoundPetsController {
  constructor(private readonly foundPetsService: FoundPetsService) {}

  @Get()
  async findAll() {
    logger.info(
      '[FoundPetsController] GET /found-pets — obteniendo listado de mascotas encontradas',
    );
    return this.foundPetsService.findAll();
  }

  @Post()
  async create(@Body() dto: FoundPetCDto) {
    logger.info(
      '[FoundPetsController] POST /found-pets — registrando nueva mascota encontrada',
    );
    return this.foundPetsService.create(dto);
  }
}
