import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { RezMerchantIdentity } from './rez-merchant-identity.interface';

/**
 * Request body for POST /auth/rez-bridge
 *
 * The client supplies the JWT it received from REZ at merchant login.
 * RestaurantHub validates it, fetches the merchant profile, upserts a
 * local user, and returns a RestaurantHub-issued access token.
 */
export class RezBridgeRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  rezToken!: string;
}

/**
 * Successful response body for POST /auth/rez-bridge
 */
export class RezBridgeResponseDto {
  /** RestaurantHub-issued JWT. Use this for all subsequent API calls. */
  accessToken!: string;

  /** The resolved merchant identity record. */
  user!: RezMerchantIdentity;

  /**
   * True if a new RestaurantHub profile was created for this merchant.
   * False if an existing profile was matched and updated.
   */
  isNewProfile!: boolean;
}
