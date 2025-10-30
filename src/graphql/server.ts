import type { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser';
import cors from 'cors';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

export async function applyGraphQL(app: Application): Promise<void> {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  app.use('/graphql', cors<cors.CorsRequest>({ origin: true, credentials: true }), bodyParser.json(), expressMiddleware(server));
}


