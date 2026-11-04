export type DoorState = 'LOCKED' | 'UNLOCKED' | 'UNKNOWN';
export type DoorCommandAction = 'UNLOCK' | 'LOCK';

export interface DoorStatus {
  state: DoorState;
  receivedAt: number;
}

export interface DoorCommandResult {
  accepted: boolean;
  commandId: string;
}

export interface DoorControlService {
  getDoorStatus: () => Promise<DoorStatus>;
  sendDoorCommand: (action: DoorCommandAction, requestId: string) => Promise<DoorCommandResult>;
}

const DEFAULT_RESPONSE_DELAY_MS = 450;
const MOCK_EXECUTION_DELAY_MS = 750;
const MOCK_AUTO_RELOCK_DELAY_MS = 5000;

const sleep = (durationMs: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, durationMs);
});

const getDemoMode = (): string | null => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('doorControlDemo');
};

const getResponseDelay = (): number => {
  switch (getDemoMode()) {
    case 'timeout':
      return 25_000;
    case 'slow':
      return 3_000;
    default:
      return DEFAULT_RESPONSE_DELAY_MS;
  }
};

let currentDoorState: DoorState = 'LOCKED';
let commandSequence = 0;
const commandResults = new Map<string, DoorCommandResult>();
let autoRelockTimer: number | null = null;

const createCommandId = () => {
  commandSequence += 1;
  return `CTRL-DEMO-${String(commandSequence).padStart(4, '0')}`;
};

const clearAutoRelock = () => {
  if (autoRelockTimer !== null) {
    window.clearTimeout(autoRelockTimer);
    autoRelockTimer = null;
  }
};

/**
 * Local adapter for the preview app. The production adapter should call
 * WiseLink queryCarStatus/controlCar and keep the same contract.
 */
export const doorControlService: DoorControlService = {
  async getDoorStatus() {
    await sleep(getResponseDelay());
    return {
      state: currentDoorState,
      receivedAt: Date.now(),
    };
  },

  async sendDoorCommand(action, requestId) {
    const existingResult = commandResults.get(requestId);
    if (existingResult) return existingResult;

    await sleep(getResponseDelay());
    if (getDemoMode() === 'fail') {
      throw new Error('DOOR_CONTROL_REJECTED');
    }

    const result = {
      accepted: true,
      commandId: createCommandId(),
    };
    commandResults.set(requestId, result);

    window.setTimeout(() => {
      currentDoorState = action === 'UNLOCK' ? 'UNLOCKED' : 'LOCKED';
      if (action === 'LOCK') {
        clearAutoRelock();
        return;
      }

      if (getDemoMode() === 'auto-lock') {
        clearAutoRelock();
        autoRelockTimer = window.setTimeout(() => {
          currentDoorState = 'LOCKED';
          autoRelockTimer = null;
        }, MOCK_AUTO_RELOCK_DELAY_MS);
      }
    }, MOCK_EXECUTION_DELAY_MS);

    return result;
  },
};
