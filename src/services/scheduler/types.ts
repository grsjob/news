/** @format */

export interface ISchedulerConfig {
  enabled: boolean;
  scheduleTime: string;
}

export interface ISchedulerService {
  start(): void;
  stop(): void;
  runScheduledTask(): Promise<void>;
}
