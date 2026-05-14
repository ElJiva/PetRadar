import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoundPet } from 'src/core/entities/found-pet.entity';
import { LostPet } from 'src/core/entities/lost-pet.entity';
import { FoundPetCDto } from 'src/core/models/found-pet.model';
import { CacheService } from 'src/cache/cache.service';
import { logger } from 'src/config/logger';
import { EmailService } from 'src/email/email.service';
import { envs } from 'src/config/envs';

const CACHE_KEY_FOUND_PETS = 'found-pets:all';
const SEARCH_RADIUS_METERS = 500;

@Injectable()
export class FoundPetsService {
  constructor(
    @InjectRepository(FoundPet)
    private readonly foundPetRepository: Repository<FoundPet>,
    @InjectRepository(LostPet)
    private readonly lostPetRepository: Repository<LostPet>,
    private readonly cacheService: CacheService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(): Promise<FoundPet[]> {
    try {
      logger.info('[FoundPetsService] Buscando mascotas encontradas en caché...');
      const cached = await this.cacheService.get<FoundPet[]>(CACHE_KEY_FOUND_PETS);

      if (cached && cached.length > 0) {
        logger.info('[FoundPetsService] Retornando mascotas encontradas desde caché');
        return cached;
      }

      logger.info('[FoundPetsService] Caché vacío, consultando base de datos...');
      const result = await this.foundPetRepository.find({
        order: { createdAt: 'DESC' },
      });

      logger.info(
        `[FoundPetsService] Se encontraron ${result.length} mascotas reportadas`,
      );
      await this.cacheService.set(CACHE_KEY_FOUND_PETS, result);
      return result;
    } catch (error) {
      logger.error('[FoundPetsService] Error al obtener mascotas encontradas');
      logger.error(String(error));
      return [];
    }
  }

  async create(dto: FoundPetCDto): Promise<{
    foundPet: FoundPet;
    nearbyLostPets: LostPet[];
  }> {
    const newFoundPet = this.foundPetRepository.create({
      description: dto.description,
      species: dto.species,
      reporterContact: dto.reporterContact,
      location: {
        type: 'Point',
        coordinates: [dto.lon, dto.lat],
      },
    });

    const savedFoundPet = await this.foundPetRepository.save(newFoundPet);
    logger.info(
      `[FoundPetsService] Mascota encontrada registrada con id=${savedFoundPet.id}`,
    );

    await this.cacheService.delete(CACHE_KEY_FOUND_PETS);

    logger.info(
      `[FoundPetsService] Buscando mascotas perdidas activas en un radio de ${SEARCH_RADIUS_METERS}m...`,
    );

    const nearbyLostPets = await this.lostPetRepository
      .createQueryBuilder('lost_pet')
      .where('lost_pet.isActive = :isActive', { isActive: true })
      .andWhere(
        `ST_DWithin(
          lost_pet.location::geography,
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
          :radius
        )`,
        { lat: dto.lat, lon: dto.lon, radius: SEARCH_RADIUS_METERS },
      )
      .getMany();

    logger.info(
      `[FoundPetsService] Se encontraron ${nearbyLostPets.length} mascotas perdidas cerca`,
    );

    // Enviar correos
    for (const lostPet of nearbyLostPets) {
      const lostLon = lostPet.location.coordinates[0];
      const lostLat = lostPet.location.coordinates[1];
      const mapboxToken = envs.MAPBOX_TOKEN;
      const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-l+FF0000(${lostLon},${lostLat}),pin-s-s+0000FF(${dto.lon},${dto.lat})/auto/600x300@2x?access_token=${mapboxToken}`;

      await this.emailService.sendEmail({
        to: lostPet.ownerContact,
        subject: `¡Posible coincidencia para tu mascota perdida!`,
        htmlBody: `
          <h1>¡Hola! Hemos encontrado una mascota similar a la tuya.</h1>
          <p>Especie: ${dto.species}</p>
          <p>Descripción: ${dto.description}</p>
          <p>Contacto de quien la encontró: ${dto.reporterContact}</p>
          <p>Ubicación:</p>
          <img src="${mapUrl}" alt="Mapa de la ubicación" />
        `,
      });
      logger.info(`[FoundPetsService] Correo enviado a ${lostPet.ownerContact}`);
    }

    return {
      foundPet: savedFoundPet,
      nearbyLostPets,
    };
  }
}
