import {AnyObject, juggler} from '@loopback/repository';
import {isObject} from 'tily/is/object';
import {isString} from 'tily/is/string';

import {Driver} from './driver';

interface QueryDriverOptions extends AnyObject {
  driver?: string;
}

export function loadDriver(ds: juggler.DataSource): Driver {
  let options: QueryDriverOptions = {};
  const query = ds.settings.query;
  if (isString(query)) {
    options = {driver: query};
  } else if (isObject(query)) {
    options = {...query};
  }
  options.driver = options.driver ?? 'sql';
  const driver = options.driver;
  const mod = require(`./drivers/${driver}`);
  const driverClass = mod.default ?? mod;
  return new driverClass(ds, options);
}
