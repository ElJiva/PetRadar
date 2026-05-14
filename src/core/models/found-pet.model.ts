import { PetSpecies } from '../enums/pet-species.enum';

export interface FoundPetCDto {
  lat: number;
  lon: number;
  description: string;
  species: PetSpecies;
  reporterContact: string;
}
