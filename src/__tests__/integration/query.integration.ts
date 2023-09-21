import {belongsTo, Entity, hasMany, juggler, model, property} from '@loopback/repository';
import {AnyObj} from 'tily/typings/types';

import {QueryEnhancedCrudRepository} from '../../repository';
import {givenRepositories} from '../support';

describe('Query Integration Tests', function () {
  let ds: juggler.DataSource;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let repos: Record<string, QueryEnhancedCrudRepository<any, any>>;

  let addressRepo: QueryEnhancedCrudRepository<Address, typeof Address.prototype.id>;
  let employeeRepo: QueryEnhancedCrudRepository<Employee, typeof Employee.prototype.id>;
  let organizationRepo: QueryEnhancedCrudRepository<Organization, typeof Organization.prototype.id>;

  beforeEach(async () => {
    ({ds, repos} = givenRepositories([Address, Employee, Organization]));
    await ds.automigrate();
    employeeRepo = repos[Employee.name];
    addressRepo = repos[Address.name];
    organizationRepo = repos[Organization.name];
  });

  it('should support finding with multiple relation paths through a same model(table)', async () => {
    const org1 = await organizationRepo.create({name: 'Org1'});
    await addressRepo.create({detail: 'Org1 Address', resourceId: org1.id});
    const employee = await employeeRepo.create({name: 'Org1 Employee', orgId: org1.id, titles: ['Org1 Employee']});

    const employeeQuery = employeeRepo.query!;
    const found = await employeeQuery.findOne({
      where: {
        or: [
          {
            'addresses.detail': {like: '%Employee%'},
          },
          {
            'org.addresses.detail': {like: '%Org%'},
          },
        ],
      },
    });
    expect(found).toEqual(employee);
  });

  it('should find with relation condition but without relation data', async () => {
    const employee = await employeeRepo.create({name: 'Foo'});
    const [found] = await employeeRepo.find({
      where: {
        'org.name': undefined,
      } as AnyObj,
      include: ['org'],
    });
    expect(found.id).toEqual(employee.id);
    expect(found.name).toEqual(employee.name);
    expect(found.org).toBeUndefined();
  });

  it('should find with relation order and non-relation where', async () => {
    const org1 = await organizationRepo.create({name: 'Org1'});
    const org2 = await organizationRepo.create({name: 'Org2'});
    const employee1 = await employeeRepo.create({name: 'Employee1', orgId: org1.id, titles: ['abc']});
    await employeeRepo.create({name: 'Employee2', orgId: org2.id, titles: ['abc']});

    const found = await employeeRepo.find({
      where: {
        name: {like: '%Employee%'},
      },
      order: ['org.name asc'],
    });
    expect(found).toHaveLength(2);
    expect(found[0]).toEqual(employee1);
  });
});

//--- HELPERS ---//
@model()
class Address extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: 'nanoid',
  })
  id: string;

  @property({
    type: 'string',
  })
  detail: string;

  @property()
  resourceId: string;

  constructor(data?: Partial<Address>) {
    super(data);
  }
}

@model()
class Employee extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: 'nanoid',
  })
  id: string;

  @property()
  name: string;

  @belongsTo(() => Organization)
  orgId: string;

  @hasMany(() => Address, {keyTo: 'resourceId'})
  addresses: Address[];

  @property({
    type: 'array',
    itemType: 'string',
  })
  titles: string[];

  org: Organization;

  constructor(data?: Partial<Employee>) {
    super(data);
  }
}

@model()
class Organization extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: 'nanoid',
  })
  id: string;

  @property()
  name: string;

  @hasMany(() => Address, {keyTo: 'resourceId'})
  addresses: Address[];

  constructor(data?: Partial<Organization>) {
    super(data);
  }
}
