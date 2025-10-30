"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyGraphQL = applyGraphQL;
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const schema_1 = require("./schema");
const resolvers_1 = require("./resolvers");
async function applyGraphQL(app) {
    const server = new server_1.ApolloServer({ typeDefs: schema_1.typeDefs, resolvers: resolvers_1.resolvers });
    await server.start();
    app.use('/graphql', (0, cors_1.default)({ origin: true, credentials: true }), body_parser_1.default.json(), (0, express4_1.expressMiddleware)(server));
}
//# sourceMappingURL=server.js.map