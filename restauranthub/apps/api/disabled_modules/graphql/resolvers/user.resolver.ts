import { Resolver, Query, Mutation, Args, Context, ID } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';
import { UserType, UserConnection } from '../types/user.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { AdvancedCacheService } from '../../cache/advanced-cache.service';
import { Cache } from '../../cache/cache.decorator';

@Resolver(() => UserType)
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly cacheService: AdvancedCacheService,
  ) {}

  @Query(() => UserType, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  @Cache('user_profile_{userId}', { ttl: 1800, namespace: 'users' })
  async getCurrentUser(@Context() context: any): Promise<UserType> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const user = await this.usersService.findById(userId);
      return user as UserType;
    } catch (error) {
      this.logger.error(`Error fetching current user: ${error.message}`);
      throw new Error('Failed to fetch user profile');
    }
  }

  @Query(() => UserType, { name: 'user' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Cache('user_details_{id}', { ttl: 3600, namespace: 'users' })
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<UserType> {
    try {
      const user = await this.usersService.findById(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      return user as UserType;
    } catch (error) {
      this.logger.error(`Error fetching user ${id}: ${error.message}`);
      throw new Error('Failed to fetch user');
    }
  }

  @Query(() => UserConnection, { name: 'users' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUsers(
    @Args('first', { type: () => Number, defaultValue: 10 }) first: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('role', { type: () => Role, nullable: true }) role?: Role,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<UserConnection> {
    try {
      const cacheKey = `users_list_${first}_${after || 'null'}_${role || 'all'}_${search || 'none'}`;

      return await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await this.usersService.findMany({
            first,
            after,
            role,
            search,
          });

          return {
            nodes: result.users as UserType[],
            totalCount: result.totalCount,
            hasNextPage: result.hasNextPage,
            hasPreviousPage: result.hasPreviousPage,
          };
        },
        { ttl: 300, namespace: 'users' } // Cache for 5 minutes
      );
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw new Error('Failed to fetch users');
    }
  }

  @Mutation(() => UserType, { name: 'updateUserProfile' })
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Context() context: any,
    @Args('name', { nullable: true }) name?: string,
    @Args('phoneNumber', { nullable: true }) phoneNumber?: string,
  ): Promise<UserType> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedUser = await this.usersService.updateProfile(userId, {
        name,
        phoneNumber,
      });

      // Invalidate cache
      await this.cacheService.del(`user_profile_${userId}`, 'users');
      await this.cacheService.del(`user_details_${userId}`, 'users');

      return updatedUser as UserType;
    } catch (error) {
      this.logger.error(`Error updating user profile: ${error.message}`);
      throw new Error('Failed to update profile');
    }
  }

  @Mutation(() => Boolean, { name: 'deleteUser' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    try {
      await this.usersService.deleteUser(id);

      // Invalidate related cache entries
      await this.cacheService.del(`user_details_${id}`, 'users');
      await this.cacheService.flush('users'); // Flush user lists

      return true;
    } catch (error) {
      this.logger.error(`Error deleting user ${id}: ${error.message}`);
      throw new Error('Failed to delete user');
    }
  }

  @Mutation(() => Boolean, { name: 'toggleUserStatus' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async toggleUserStatus(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    try {
      await this.usersService.toggleUserStatus(id);

      // Invalidate cache
      await this.cacheService.del(`user_details_${id}`, 'users');
      await this.cacheService.flush('users');

      return true;
    } catch (error) {
      this.logger.error(`Error toggling user status ${id}: ${error.message}`);
      throw new Error('Failed to toggle user status');
    }
  }
}