/* eslint-disable @typescript-eslint/no-explicit-any */
import {Filter} from '@loopback/filter';
import {Connector, ensurePromise, juggler, ModelDefinition, Options, PositionalParameters} from '@loopback/repository';
import {assert} from 'tily/assert';

export interface SqlConnector extends Connector {
  getModelDefinition(modelName: string): ModelDefinition | undefined;

  idNames(model: string): string[];

  escapeName(name: string): string;

  table(modelName: string): string;

  tableEscaped(modelName: string): string;

  column(modelName: string, prop: string): string;

  columnEscaped(modelName: string, property: string): string;

  buildColumnNames(modelName: string, filter: Filter): string | string[];

  fromRow(model: string, rowData: Record<string, any>): Record<string, any>;
}

/**
 * Object-Persistence Mapping
 */
export interface Orm {
  getModelDefinition(modelName: string): ModelDefinition | undefined;

  idNames(model: string): string[];

  escapeName(name: string): string;

  /**
   * Get the table name for the given model. The table name can be customized
   * at model settings as `table` or `tableName`. For example,
   *
   * ```json
   * "Customer": {
   *   "name": "Customer",
   *   "mysql": {
   *     "table": "CUSTOMER"
   *   }
   * }
   * ```
   *
   * Returns the table name (String).
   * @param {String} model The model name
   */
  table(model: string): string;

  /**
   * Get the escaped table name
   * @param {String} model The model name
   * @returns {String} the escaped table name
   */
  tableEscaped(model: string): string;

  /**
   * Return the database name of the property of the model if it exists.
   * Otherwise return the property name.
   * Some connectors allow the column/field name to be customized
   * at the model property definition level as `column`,
   * `columnName`, or `field`. For example,
   *
   * ```json
   * "name": {
   *   "type": "string",
   *   "mysql": {
   *     "column": "NAME"
   *   }
   * }
   * ```
   * @param {String} model The target model name
   * @param {String} prop The property name
   *
   * @returns {String} The database mapping name of the property of the model if it exists
   */
  column(model: string, prop: string): string;

  /**
   * Get the escaped column name for a given model property
   * @param {String} model The model name
   * @param {String} property The property name
   * @param {String} [withTable] if true prepend the table name (default= false)
   * @param {String} [prefix] add a prefix to column (for alias)
   * @returns {String} The escaped column name
   */
  columnEscaped(model: string, property: string, withTable?: boolean, prefix?: string): string;

  /**
   * Build a list of escaped column names for the given model and fields filter
   * @param {string} model Model name
   * @param {object} filter The filter object
   * @returns {string[]} Escaped column names
   */
  buildColumnNames(model: string, filter: Filter): string[];

  fromRow(model: string, rowData: Record<string, any>): Record<string, any>;

  /**
   * Execute a SQL command.
   *
   * **WARNING:** In general, it is always better to perform database actions
   * through repository methods. Directly executing SQL may lead to unexpected
   * results, corrupted data, security vulnerabilities and other issues.
   *
   * @example
   *
   * ```ts
   * // MySQL
   * const result = await db.execute(
   *   'SELECT * FROM Products WHERE size > ?',
   *   [42]
   * );
   *
   * // PostgreSQL
   * const result = await db.execute(
   *   'SELECT * FROM Products WHERE size > $1',
   *   [42]
   * );
   * ```
   *
   * @param command A parameterized SQL command or query.
   * Check your database documentation for information on which characters to
   * use as parameter placeholders.
   * @param parameters List of parameter values to use.
   * @param options Additional options, for example `transaction`.
   * @returns A promise which resolves to the command output as returned by the
   * database driver. The output type (data structure) is database specific and
   * often depends on the command executed.
   */
  execute(command: string | object, parameters?: any[] | object, options?: Options): Promise<any>;

  /**
   * Execute a MongoDB command.
   *
   * **WARNING:** In general, it is always better to perform database actions
   * through repository methods. Directly executing MongoDB commands may lead
   * to unexpected results and other issues.
   *
   * @example
   *
   * ```ts
   * const result = await db.execute('MyCollection', 'aggregate', [
   *   {$lookup: {
   *     // ...
   *   }},
   *   {$unwind: '$data'},
   *   {$out: 'tempData'}
   * ]);
   * ```
   *
   * @param collectionName The name of the collection to execute the command on.
   * @param command The command name. See
   * [Collection API docs](http://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html)
   * for the list of commands supported by the MongoDB client.
   * @param parameters Command parameters (arguments), as described in MongoDB API
   * docs for individual collection methods.
   * @returns A promise which resolves to the command output as returned by the
   * database driver.
   */
  execute(collectionName: string, command: string, ...parameters: any[]): Promise<any>;

  /**
   * Execute a raw database command using a connector that's not described
   * by LoopBack's `execute` API yet.
   *
   * **WARNING:** In general, it is always better to perform database actions
   * through repository methods. Directly executing database commands may lead
   * to unexpected results and other issues.
   *
   * @param args Command and parameters, please consult your connector's
   * documentation to learn about supported commands and their parameters.
   * @returns A promise which resolves to the command output as returned by the
   * database driver.
   */
  execute(...args: any[]): Promise<any>;
}

export class DefaultOrm implements Orm {
  constructor(protected ds?: juggler.DataSource) {}

  get connector() {
    return this.ds?.connector as SqlConnector;
  }

  getModelDefinition(modelName: string): ModelDefinition | undefined {
    if (this.connector) {
      return this.connector.getModelDefinition(modelName);
    }
    throw new Error(`"connector" is required to get model definition for ${modelName}`);
  }

  idNames(model: string): string[] {
    if (this.connector) {
      this.ensureModelHasBeenDefined(model);
      return this.connector.idNames(model);
    }
    return [];
  }

  escapeName(name: string): string {
    if (this.connector) {
      return this.connector.escapeName(name);
    }
    return name;
  }

  column(model: string, prop: string): string {
    if (this.connector) {
      this.ensureModelHasBeenDefined(model);
      return this.connector.column(model, prop);
    }
    return prop;
  }

  columnEscaped(model: string, property: string, withTable = false, prefix = ''): string {
    if (this.connector) {
      this.ensureModelHasBeenDefined(model);
      const column = this.connector.columnEscaped(model, property);
      if (withTable) {
        return this.connector.escapeName(prefix + this.connector.table(model)) + '.' + column;
      }
      return column;
    }
    return withTable ? `${prefix}${model}.${property}` : property;
  }

  table(model: string): string {
    if (this.connector) {
      this.ensureModelHasBeenDefined(model);
      return this.connector.table(model);
    }
    return model;
  }

  tableEscaped(model: string): string {
    if (this.connector) {
      this.ensureModelHasBeenDefined(model);
      return this.connector.tableEscaped(model);
    }
    return model;
  }

  buildColumnNames(model: string, filter: Filter): string[] {
    if (this.connector) {
      this.ensureModelHasBeenDefined(model);
      const c = this.connector.buildColumnNames(model, filter);
      return Array.isArray(c) ? c : c.split(',').map(s => s.trim());
    }
    return [];
  }

  fromRow(model: string, rowData: Record<string, any>): Record<string, any> {
    if (this.connector) {
      this.ensureModelHasBeenDefined(model);
      return this.connector.fromRow(model, rowData);
    }
    return rowData;
  }

  async execute(...args: PositionalParameters): Promise<any> {
    assert(this.ds, `Orm is missing a datasource to execute the command.`);
    return ensurePromise(this.ds.execute(...args));
  }

  protected ensureModelHasBeenDefined(model: string): void {
    if (!this.connector) {
      throw new Error(`"connector" is required to check model for ${model}`);
    }
    if (!this.connector.getModelDefinition(model)) {
      throw new Error(`Model "${model}" is not defined in current connector "${this.connector.name}".`);
    }
  }
}
