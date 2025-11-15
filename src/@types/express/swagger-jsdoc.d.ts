declare module "swagger-jsdoc" {
  interface Options {
    definition: any;
    apis: string[];
  }

  export default function swaggerJsdoc(options: Options): any;
}
