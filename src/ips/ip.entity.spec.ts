import { Ip } from './ip.entity';

describe('Ip Entity', () => {
  it('should create an instance', () => {
    const ip = new Ip();
    expect(ip).toBeDefined();
  });

  it('should have all properties', () => {
    const ip = new Ip();
    ip.id = 1;
    ip.ip = '1.2.3.4';
    ip.created_at = new Date();

    expect(ip.id).toBe(1);
    expect(ip.ip).toBe('1.2.3.4');
    expect(ip.created_at).toBeInstanceOf(Date);
  });

  it('should allow setting properties', () => {
    const ip = new Ip();
    const testDate = new Date('2024-01-01');

    ip.id = 42;
    ip.ip = '192.168.1.1';
    ip.created_at = testDate;

    expect(ip.id).toBe(42);
    expect(ip.ip).toBe('192.168.1.1');
    expect(ip.created_at).toBe(testDate);
  });
});

