import { PetSpecies } from '../enums/pet-species.enum';

export interface LostPetCDto {
  lat: number;
  lon: number;
  petName: string;
  species: PetSpecies;
  description: string;
  ownerContact: string;
}
