import { Resolver, Query, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { RestaurantsService } from '../../modules/restaurants/restaurants.service';
import { RestaurantType, RestaurantConnection } from '../types/restaurant.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdvancedCacheService } from '../../cache/advanced-cache.service';
import { Cache } from '../../cache/cache.decorator';

@Resolver(() => RestaurantType)
export class RestaurantResolver {
  private readonly logger = new Logger(RestaurantResolver.name);

  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly cacheService: AdvancedCacheService,
  ) {}

  @Query(() => RestaurantType, { name: 'restaurant' })
  @Cache('restaurant_details_{id}', { ttl: 3600, namespace: 'restaurants' })
  async getRestaurant(@Args('id', { type: () => ID }) id: string): Promise<RestaurantType> {
    try {
      const restaurant = await this.restaurantsService.findById(id);
      if (!restaurant) {
        throw new Error(`Restaurant with ID ${id} not found`);
      }
      return restaurant as RestaurantType;
    } catch (error) {
      this.logger.error(`Error fetching restaurant ${id}: ${error.message}`);
      throw new Error('Failed to fetch restaurant');
    }
  }

  @Query(() => RestaurantConnection, { name: 'restaurants' })
  async getRestaurants(
    @Args('first', { type: () => Number, defaultValue: 10 }) first: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('city', { type: () => String, nullable: true }) city?: string,
    @Args('cuisine', { type: () => String, nullable: true }) cuisine?: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<RestaurantConnection> {
    try {
      const cacheKey = `restaurants_list_${first}_${after || 'null'}_${city || 'all'}_${cuisine || 'all'}_${search || 'none'}`;

      return await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await this.restaurantsService.findMany({
            first,
            after,
            city,
            cuisine,
            search,
          });

          return {
            nodes: result.restaurants as RestaurantType[],
            totalCount: result.totalCount,
            hasNextPage: result.hasNextPage,
            hasPreviousPage: result.hasPreviousPage,
          };
        },
        { ttl: 600, namespace: 'restaurants' } // Cache for 10 minutes
      );
    } catch (error) {
      this.logger.error(`Error fetching restaurants: ${error.message}`);
      throw new Error('Failed to fetch restaurants');
    }
  }

  @Query(() => [RestaurantType], { name: 'myRestaurants' })
  @UseGuards(JwtAuthGuard)
  @Cache('my_restaurants_{userId}', { ttl: 1800, namespace: 'restaurants' })
  async getMyRestaurants(@Context() context: any): Promise<RestaurantType[]> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const restaurants = await this.restaurantsService.findByOwnerId(userId);
      return restaurants as RestaurantType[];
    } catch (error) {
      this.logger.error(`Error fetching user restaurants: ${error.message}`);
      throw new Error('Failed to fetch your restaurants');
    }
  }
}