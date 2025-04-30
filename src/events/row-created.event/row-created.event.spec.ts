import { RowCreatedEvent } from './row-created.event';

describe('RowCreatedEvent', () => {
  it('should be defined', () => {
    expect(new RowCreatedEvent()).toBeDefined();
  });
});
