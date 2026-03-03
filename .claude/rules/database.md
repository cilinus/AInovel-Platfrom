# Database Rules - MongoDB

Database-specific rules and guidelines for the AiNovel Platform.

## Database Architecture

### Primary Database: MongoDB

- **ODM**: Mongoose 8.x with schema management
- **Connection**: Managed through ConfigService + MongooseModule.forRootAsync
- **Collections**: users, works, episodes, purchases, token_transactions
- **Transactions**: MongoDB replica set sessions for multi-document operations

## Connection Configuration

```typescript
// via NestJS ConfigModule
MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.get<string>('MONGODB_URI'),
  }),
});
```

## Schema Design

### Core Schemas

| Schema | Collection | Key Features |
|--------|------------|-------------|
| User | users | Sparse unique email, social accounts, text index |
| Work | works | Compound indexes (genre+status+date), text search |
| Episode | episodes | Unique compound (workId+episodeNumber) |
| Purchase | purchases | Unique (userId+episodeId), TTL index |
| TokenTransaction | token_transactions | Idempotency key, userId+date index |

### Schema Patterns

- Use `@Schema({ timestamps: true })` for automatic createdAt/updatedAt
- Use `Types.ObjectId` with `ref` for relationships
- Use `@Schema({ _id: false })` for embedded sub-documents
- Define indexes with `SchemaFactory` after schema creation

```typescript
WorkSchema.index({ genre: 1, status: 1, createdAt: -1 });
WorkSchema.index({ title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, description: 1 } });
```

## Query Logging Rules

All database queries MUST be logged via BaseRepository or explicit logger calls.

```typescript
// BaseRepository handles logging automatically
this.logger.debug(`findById: ${id}`);
this.logger.debug(`find: ${JSON.stringify(filter)}`);
```

| Level | Use Case |
|-------|----------|
| DEBUG | All read queries (find, findOne, count) |
| DEBUG | Write queries (create, update, delete) |
| WARN | Slow queries (> 1s) |
| ERROR | Failed queries |

## Transaction Handling

```typescript
// MongoDB session-based transactions (requires replica set)
const session = await this.connection.startSession();
try {
  session.startTransaction();
  await this.userModel.findByIdAndUpdate(userId, update, { session });
  await this.txModel.create([txData], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Query Optimization

- Use `.select()` to limit returned fields
- Use `.lean()` for read-only queries (returns plain objects)
- Use pagination (`skip` + `limit`) for large result sets
- Use `.populate()` selectively with field projection
- Avoid `$where` operator

```typescript
const works = await this.workModel
  .find(filter)
  .select('title genre status stats')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('authorId', 'nickname')
  .lean();
```

## Do's

- Log all queries with complete parameters
- Use Mongoose schemas with proper indexes
- Use transactions for multi-document operations
- Create compound indexes for common query patterns
- Use `.lean()` for read-heavy endpoints

## Don'ts

- Don't skip query logging
- Don't use `$where` or string-based evaluation
- Don't skip error handling in transactions
- Don't create unbounded queries (always use limit)
- Don't ignore index design for frequently queried fields
