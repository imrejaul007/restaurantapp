import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class AddressType {
  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zipCode: string;

  @Field()
  country: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;
}

@ObjectType()
export class RestaurantType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  ownerId: string;

  @Field(() => AddressType)
  address: AddressType;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  website?: string;

  @Field(() => [String], { nullable: true })
  cuisineTypes?: string[];

  @Field({ nullable: true })
  logo?: string;

  @Field(() => [String], { nullable: true })
  images?: string[];

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field({ defaultValue: false })
  isVerified: boolean;

  @Field({ defaultValue: true })
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class RestaurantConnection {
  @Field(() => [RestaurantType])
  nodes: RestaurantType[];

  @Field()
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}