describe('Setup Validation', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to test helpers', () => {
    const { generateTestToken, validMedicationData } = require('../tests/helpers');

    expect(generateTestToken).toBeDefined();
    expect(validMedicationData).toBeDefined();
    expect(validMedicationData.name).toBe('Paracetamol');
  });

  it('should be able to mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');

    expect(mockFn).toHaveBeenCalledWith('test');
  });
});
