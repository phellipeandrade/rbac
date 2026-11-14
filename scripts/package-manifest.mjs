export const entries = [
  {
    "name": "core",
    "names": [
      "createRBAC"
    ],
    "types": [
      "RBACOptions",
      "RBACConfig",
      "RBACEngine",
      "Role",
      "Roles",
      "When",
      "WhenCallback",
      "WhenFunction",
      "PatternPermission"
    ]
  },
  {
    "name": "adapters",
    "names": [
      "createTenantRBAC",
      "MongoRoleAdapter",
      "MySQLRoleAdapter",
      "PostgresRoleAdapter"
    ],
    "types": [
      "RoleAdapter"
    ]
  },
  {
    "name": "express",
    "names": [
      "createExpressMiddleware"
    ],
    "types": [
      "ExpressOptions",
      "ExpressRequestLike",
      "ExpressResponseLike",
      "ExpressNextFunction"
    ]
  },
  {
    "name": "fastify",
    "names": [
      "createFastifyMiddleware"
    ],
    "types": [
      "FastifyOptions",
      "FastifyRequestLike",
      "FastifyReplyLike"
    ]
  },
  {
    "name": "nestjs",
    "names": [
      "createNestMiddleware",
      "createNestGuard"
    ],
    "types": [
      "NestOptions",
      "NestExecutionContext",
      "NestNextFunction",
      "NestRequest",
      "NestResponse"
    ]
  },
  {
    "name": "schemas",
    "names": [
      "whenSchema",
      "roleOperationSchema",
      "roleSchema",
      "rolesSchema"
    ],
    "types": []
  }
];
