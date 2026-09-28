import { mutationGeneric, queryGeneric, type MutationBuilder, type QueryBuilder, type DataModelFromSchemaDefinition, type GenericMutationCtx, type GenericQueryCtx } from 'convex/server';
import schema from './schema';
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export const query = queryGeneric as QueryBuilder<DataModel, 'public'>;
export const mutation = mutationGeneric as MutationBuilder<DataModel, 'public'>;
export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
