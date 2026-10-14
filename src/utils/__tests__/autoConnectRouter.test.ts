import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { probeAndAutoConnectAllRoutes, DEFAULT_TOPOLOGY } from '../autoConnectRouter';

describe('probeAndAutoConnectAllRoutes', () => {
  const originalFetch = global.fetch;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    // mock saveRoutingTopology which touches localStorage/window
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should handle fetch rejection and return fallback topology', async () => {
    // Mock fetch to reject, simulating a network error
    const testError = new Error('Network failure');
    mockFetch.mockRejectedValueOnce(testError);

    // Also spy on console.warn to verify it logs the fallback
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await probeAndAutoConnectAllRoutes();

    // Verify fetch was called with correct args
    expect(mockFetch).toHaveBeenCalledWith('/api/auto-connect/probe-all', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));

    // Verify catch block executed
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[AutoConnect Router] Fallback to client-side heuristic auto-connection',
      testError
    );

    // Verify fallback logic
    expect(result).toBeDefined();
    // Verify properties match fallback topology, allowing for updated timestamps
    expect(result.overallStatus).toBe(DEFAULT_TOPOLOGY.overallStatus);
    expect(result.autoHealingActive).toBe(DEFAULT_TOPOLOGY.autoHealingActive);

    expect(result.textLlm.id).toBe(DEFAULT_TOPOLOGY.textLlm.id);
    expect(result.imageDiffusion.id).toBe(DEFAULT_TOPOLOGY.imageDiffusion.id);

    // Verify timestamp were updated
    expect(result.textLlm.lastVerified).toBeDefined();
  });

  it('should handle non-ok response and return fallback topology', async () => {
    // Mock fetch to resolve but with ok: false (e.g. 500 error)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await probeAndAutoConnectAllRoutes();

    // We shouldn't hit the catch block console.warn here, as fetch itself didn't reject,
    // but we should still get the fallback topology

    expect(result).toBeDefined();
    expect(result.overallStatus).toBe(DEFAULT_TOPOLOGY.overallStatus);
  });

  it('should handle success response with topology data', async () => {
    const mockTopology = {
       ...DEFAULT_TOPOLOGY,
       overallStatus: 'Test_Connected'
    };

    // Mock fetch to resolve with success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ topology: mockTopology }),
    });

    const result = await probeAndAutoConnectAllRoutes();

    expect(result).toEqual(mockTopology);
  });
});
