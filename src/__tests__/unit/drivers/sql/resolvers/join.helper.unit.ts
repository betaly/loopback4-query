import {parseRelationChain} from '../../../../../drivers';
import {Org} from '../../../../fixtures/models/org';
import {User} from '../../../../fixtures/models/user';

describe('parseRelationChain', () => {
  it('should parse a relation chain', () => {
    const result = parseRelationChain(Org.definition, 'users.email');
    expect(result?.property).toBeTruthy();
    expect(result).toMatchObject({
      relationChain: [{name: 'users'}],
      propertyKey: 'email',
    });
  });

  it('should parse a relation chain with nested data', () => {
    const result = parseRelationChain(Org.definition, 'users.address.city');
    expect(result?.property).toBeTruthy();
    expect(result).toMatchObject({
      relationChain: [{name: 'users'}],
      propertyKey: 'address.city',
    });
  });

  it('should parse a relation without property', () => {
    const result = parseRelationChain(Org.definition, 'users.userInfo');
    expect(result?.property).toBeUndefined();
    expect(result).toMatchObject({
      relationChain: [{name: 'users'}, {name: 'userInfo'}],
    });
  });

  it('should return undefined for property key', () => {
    expect(parseRelationChain(User.definition, 'address.city')).toBeUndefined();
  });

  it('should throw an error for not existing relation', () => {
    expect(() => parseRelationChain(Org.definition, '__not_exist__.email')).toThrow(/No relation and property found/);
  });

  it('should throw an error if property is not in last relation target', () => {
    expect(() => parseRelationChain(Org.definition, 'users.userInfo.__not_exist__')).toThrow(
      /"__not_exist__" is not in model/,
    );
  });
});
