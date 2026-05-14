import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LostPet } from 'src/core/entities/lost-pet.entity';
import { LostPetCDto } from 'src/core/models/lost-pet.model';
import { CacheService } from 'src/cache/cache.service';
import { logger } from 'src/config/logger';

const CACHE_KEY_LOST_PETS = 'lost-pets:all';

@Injectable()
export class LostPetsService {
  constructor(
    @InjectRepository(LostPet)
    private readonly lostPetRepository: Repository<LostPet>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(): Promise<LostPet[]> {
    try {
      logger.info('[LostPetsService] Buscando mascotas perdidas en caché...');
      const cached = await this.cacheService.get<LostPet[]>(CACHE_KEY_LOST_PETS);

      if (cached && cached.length > 0) {
        logger.info('[LostPetsService] Retornando mascotas perdidas desde caché');
        return cached;
      }

      logger.info('[LostPetsService] Caché vacío, consultando base de datos...');
      const result = await this.lostPetRepository.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });

      logger.info(
        `[LostPetsService] Se encontraron ${result.length} mascotas perdidas activas`,
      );
      await this.cacheService.set(CACHE_KEY_LOST_PETS, result);
      return result;
    } catch (error) {
      logger.error('[LostPetsService] Error al obtener mascotas perdidas');
      logger.error(String(error));
      return [];
    }
  }

  async create(dto: LostPetCDto): Promise<LostPet> {
    const newLostPet = this.lostPetRepository.create({
      petName: dto.petName,
      species: dto.species,
      description: dto.description,
      ownerContact: dto.ownerContact,
      location: {
        type: 'Point',
        coordinates: [dto.lon, dto.lat],
      },
      isActive: true,
    });

    const saved = await this.lostPetRepository.save(newLostPet);
    logger.info(
      `[LostPetsService] Mascota perdida registrada con id=${saved.id}`,
    );

    // Invalidar caché
    await this.cacheService.delete(CACHE_KEY_LOST_PETS);

    return saved;
  }
}
