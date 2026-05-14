import { Module } from '@nestjs/common';
import { LostPetsModule } from './lost-pets/lost-pets.module';
import { FoundPetsModule } from './found-pets/found-pets.module';

@Module({
  imports: [LostPetsModule, FoundPetsModule],
})
export class PetsModule {}
