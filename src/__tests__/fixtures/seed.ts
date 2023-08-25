import {Repos} from '../support';
import {
  DeliveryRepo,
  IssueRepo,
  LetterRepo,
  OrgRepo,
  OrgUserRepo,
  ParcelRepo,
  ProjRepo,
  SenderDeliverableRepo,
  SenderRepo,
  TransportRepo,
  UserInfoRepo,
  UserRepo,
} from './repos';

export async function seed(repos: Repos) {
  const userRepo = repos['User'] as UserRepo;
  const userInfoRepo = repos['UserInfo'] as UserInfoRepo;
  const orgRepo = repos['Org'] as OrgRepo;
  const orgUserRepo = repos['OrgUser'] as OrgUserRepo;
  const projRepo = repos['Proj'] as ProjRepo;
  const issueRepo = repos['Issue'] as IssueRepo;

  const letterRepo = repos['Letter'] as LetterRepo;
  const parcelRepo = repos['Parcel'] as ParcelRepo;
  const deliveryRepo = repos['Delivery'] as DeliveryRepo;
  const transportRepo = repos['Transport'] as TransportRepo;
  const senderRepo = repos['Sender'] as SenderRepo;
  const senderDeliverableRepo = repos['SenderDeliverable'] as SenderDeliverableRepo;

  // create in order for findOne
  const users = [
    await userRepo.create({email: 'user1@example.com', address: {city: 'city1', street: 'street1'}}),
    await userRepo.create({email: 'user2@example.com', address: {city: 'city2', street: 'street2'}}),
    await userRepo.create({email: 'user3@example.com', address: {city: 'city3', street: 'street3'}}),
    await userRepo.create({email: 'user4@example.com', address: {city: 'city4', street: 'street4'}}),
  ];

  await userInfoRepo.createAll([
    {info: 'user1@example.com info', userId: users[0].id, a: 1, b: 1},
    {info: 'user2@example.com info', userId: users[1].id, a: 2, b: 3},
    {info: 'user3@example.com info', userId: users[2].id, a: 5, b: 4},
  ]);

  const orgs = await orgRepo.createAll([{name: 'OrgA'}, {name: 'OrgB'}, {name: 'OrgC'}]);

  await orgUserRepo.createAll([
    {orgId: orgs[0].id, userId: users[0].id},
    {orgId: orgs[0].id, userId: users[1].id},
    {orgId: orgs[1].id, userId: users[0].id},
    {orgId: orgs[2].id, userId: users[2].id},
  ]);

  const projs = await projRepo.createAll([
    {name: 'OrgA_Proj1', org_id: orgs[0].id},
    {name: 'OrgA_Proj2', org_id: orgs[0].id},
    {name: 'OrgB_Proj1', org_id: orgs[1].id},
    {name: 'OrgB_Proj2', org_id: orgs[1].id},
    {name: 'OrgC_Proj1', org_id: orgs[2].id},
    {name: 'OrgC_Proj2', org_id: orgs[2].id},
  ]);

  await issueRepo.createAll([
    {title: 'OrgA_Proj1_Issue1', projId: projs[0].id, creatorId: users[0].id},
    {title: 'OrgA_Proj1_Issue2', projId: projs[0].id, creatorId: users[1].id},
    {title: 'OrgA_Proj1_Issue3', projId: projs[0].id, creatorId: users[2].id},
    {title: 'OrgA_Proj2_Issue1', projId: projs[1].id, creatorId: users[0].id},
    {title: 'OrgA_Proj2_Issue2', projId: projs[1].id, creatorId: users[1].id},
    {title: 'OrgA_Proj2_Issue3', projId: projs[1].id, creatorId: users[2].id},
    {title: 'OrgB_Proj1_Issue1', projId: projs[2].id, creatorId: users[0].id},
  ]);

  const deliveries = [
    await deliveryRepo.create({deliverableType: 'Letter'}),
    await deliveryRepo.create({deliverableType: 'Parcel'}),
    await deliveryRepo.create({deliverableType: 'Parcel'}),
  ];

  const letters = [await letterRepo.create({letterTitle: 'letter1', deliveryId: deliveries[0].id})];

  const parcels = [
    await parcelRepo.create({parcelTitle: 'parcel1', deliveryId: deliveries[1].id}),
    await parcelRepo.create({parcelTitle: 'parcel2', deliveryId: deliveries[2].id}),
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const transports = [
    await transportRepo.create({
      name: 'transport1',
      deliverableType: letters[0].constructor.name,
      deliverableId: letters[0].id,
    }),
    await transportRepo.create({
      name: 'transport2',
      deliverableType: parcels[0].constructor.name,
      deliverableId: parcels[0].id,
    }),
    await transportRepo.create({
      name: 'transport3',
      deliverableType: parcels[1].constructor.name,
      deliverableId: parcels[1].id,
    }),
  ];

  const senders = [await senderRepo.create({name: 'sender1'}), await senderRepo.create({name: 'sender2'})];

  await senderDeliverableRepo.createAll([
    {senderId: senders[0].id, deliverableType: parcels[0].constructor.name, deliverableId: parcels[0].id},
    {senderId: senders[0].id, deliverableType: parcels[1].constructor.name, deliverableId: parcels[1].id},
  ]);
}
