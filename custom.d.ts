declare namespace NodeJS {
  interface ProcessEnv {
    readonly MYSQL_HOST: string;
    readonly MYSQL_USER: string;
    readonly MYSQL_DATABASE: string;
    readonly MYSQL_PASSWORD: string;
  }
}
