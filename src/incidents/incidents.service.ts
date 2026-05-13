import { Injectable } from '@nestjs/common';
import { EmailOptions } from 'src/core/models/email-options.model';
import { Incident } from 'src/core/entities/incident.entity';
import { EmailService } from 'src/email/email.service';
import { generateIncidentEmailTemplate } from './templates/incident.template';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IncidentCDto } from 'src/core/models/incident.model';
import Redis from 'ioredis';
import { envs } from 'src/config/envs';
import { CacheService } from 'src/cache/cache.service';

const CACHE_KEY_ALL_INCIDENTS = "incidents:all"


@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentrepository: Repository<Incident>,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService
  ) {}

  async findAll(): Promise<Incident[]> {
    try {
      console.log(
        '[IncidentService] Ejecutando query de todos los incidentes...',
      );
      const incidentsObject = await this.cacheService.get<Incident[]>(CACHE_KEY_ALL_INCIDENTS);

      if(incidentsObject && incidentsObject.length > 0){
        return incidentsObject;
      }

      const result = await this.incidentrepository.find();
      console.log(
        `[IncidentService] Se encontraron ${result.length} incidentes `,
      );
      await this.cacheService.set(CACHE_KEY_ALL_INCIDENTS,result);
      return result;
    } catch (error) {
      console.error('[IncidentService] Error al obtener incidentes:');
      console.error(error);
      return [];
    }
  }

  async findInRadius(
    lat: number,
    lon: number,
    radius: number,
  ): Promise<Incident[]> {
    try {
      const result = await this.incidentrepository
        .createQueryBuilder('incident')
        .where(
          `ST_DWithin(
          incident.location::geography,
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
          :radius
        )`,
          { lat, lon, radius },
        )
        .getMany();
      return result;
    } catch (error) {
      console.error('[IncidentService] Error al obtener incidentes por radio:');
      console.error(error);
      return [];
    }
  }

  async createIncident(incident: IncidentCDto): Promise<Boolean> {
    // Save
    // Generar un nuevo registro de la entidad de Incident
    const newIncident = this.incidentrepository.create({
      title: incident.title,
      description: incident.description,
      type: incident.type,
      location: {
        type: 'Point',
        coordinates: [incident.lon, incident.lat],
      },
    });
    const generatedIncident = await this.incidentrepository.save(newIncident);
    await this.cacheService.delete(CACHE_KEY_ALL_INCIDENTS);
    const template = generateIncidentEmailTemplate(incident);
    const options: EmailOptions = {
      to: envs.MAILER_EMAIL,
      subject: incident.title,
      htmlBody: template,
    };

    const result = await this.emailService.sendEmail(options);
    return result;
  }
}
