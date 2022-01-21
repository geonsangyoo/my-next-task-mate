import { ApolloServer, gql } from 'apollo-server-micro';

import mysql from 'serverless-mysql';
import { OkPacket } from 'mysql';
import { Resolvers, TaskStatus } from '../../generated/graphql-backend';

const typeDefs = gql`
  enum TaskStatus {
    active
    completed
  }

  type Task {
    id: Int!
    title: String!
    status: TaskStatus!
  }

  input UpdateTaskInput {
    id: Int!
    title: String
    status: TaskStatus
  }

  type Query {
    tasks(status: TaskStatus): [Task!]!
    task(id: Int!): Task
  }

  input CreateTaskInput {
    title: String!
  }

  type Mutation {
    createTask(input: CreateTaskInput!): Task
    updateTask(input: UpdateTaskInput!): Task
    deleteTask(id: Int!): Task
  }
`;

type ApolloContext = {
  db: mysql.ServerlessMysql;
};

type Task = {
  id: number;
  title: string;
  status: TaskStatus;
};

type TaskDbRow = {
  id: number;
  title: string;
  task_status: TaskStatus;
};

type TaskDbQueryResult = TaskDbRow[];

const resolvers: Resolvers<ApolloContext> = {
  Query: {
    async tasks(parent, args, context) {
      const { status } = args;
      let qry = 'SELECT id, title, task_status FROM tasks WHERE 1 = 1';
      const qryParams: string[] = [];
      if (status) {
        qry += ' AND task_status = ?';
        qryParams.push(status);
      }
      const tasks = await context.db.query<TaskDbQueryResult>(qry, qryParams);
      await db.end();
      return tasks.map(({ id, title, task_status }) => {
        return {
          id,
          title,
          status: task_status,
        };
      });
    },
    task() {
      return null;
    },
  },
  Mutation: {
    async createTask(
      parent,
      args: { input: { title: string } },
      context
    ): Promise<Task> {
      const result = await context.db.query<OkPacket>(
        'INSERT INTO tasks (title, task_status) VALUES (?, ?)',
        [args.input.title, TaskStatus.Active]
      );
      return {
        id: result.insertId,
        title: args.input.title,
        status: TaskStatus.Active,
      };
    },
    updateTask(parent, args, context) {
      return null;
    },
    deleteTask(parent, args, context) {
      return null;
    },
  },
};

const db = mysql({
  config: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT,
  },
});

const apolloServer = new ApolloServer({ typeDefs, resolvers, context: { db } });

const startServer = apolloServer.start();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://studio.apollographql.com'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  if (req.method === 'OPTIONS') {
    res.end();
    return false;
  }

  await startServer;
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
