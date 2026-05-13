import {
  Body,
  Controller,
  Get,
  ParseFloatPipe,
  Post,
  Query,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import type { IncidentCDto } from 'src/core/models/incident.model';
import { logger } from 'src/config/logger';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentService: IncidentsService) {}

  @Get()
  async findAllIncidents() {
    logger.info(
      '[IncidentsController] Recibiendo solicitud para obtener todos los incidentes...',
    );
    const result = await this.incidentService.findAll();
    return result;
  }

  @Get('search/radius')
  async findIncidentByRadius(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
    @Query('radiusInMeters', ParseFloatPipe) radiusInMeters: number,
  ) {
    logger.info(
      `[IncidentController] Buscando incidentes en un radio de ${radiusInMeters} m`,
    );
    const result = await this.incidentService.findInRadius(
      lat,
      lon,
      radiusInMeters,
    );
    return result;
  }

  @Post()
  async createIncident(@Body() incident: IncidentCDto) {
    logger.info(
      '[IncidentsController] Recibiendo solicitud para crear un nuevo incidente...',
    );
    const result = await this.incidentService.createIncident(incident);
    return result;
  }
}
