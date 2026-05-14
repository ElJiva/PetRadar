import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoundPet } from 'src/core/entities/found-pet.entity';
import { LostPet } from 'src/core/entities/lost-pet.entity';
import { FoundPetCDto } from 'src/core/models/found-pet.model';
import { CacheService } from 'src/cache/cache.service';
import { logger } from 'src/config/logger';

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

    return {
      foundPet: savedFoundPet,
      nearbyLostPets,
    };
  }
}
