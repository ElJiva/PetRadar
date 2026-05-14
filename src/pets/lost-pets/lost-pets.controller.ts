import { Body, Controller, Get, Post } from '@nestjs/common';
import { LostPetsService } from './lost-pets.service';
import type { LostPetCDto } from 'src/core/models/lost-pet.model';
import { logger } from 'src/config/logger';

//Controlador para perros perdidos
@Controller('lost-pets')
export class LostPetsController {
  constructor(private readonly lostPetsService: LostPetsService) {}

  @Get()
  async findAll() {
    logger.info(
      '[LostPetsController] GET /lost-pets — obteniendo listado de mascotas perdidas',
    );
    return this.lostPetsService.findAll();
  }

  @Post()
  async create(@Body() dto: LostPetCDto) {
    logger.info(
      '[LostPetsController] POST /lost-pets — registrando nueva mascota perdida',
    );
    return this.lostPetsService.create(dto);
  }
}
