import { Scene } from '../../lib/scene';

export class Job {

  scene: Scene;
  name: string;
  start: Date;
  status: number;
  width: number;
  height: number;

  static STATUS_STARTING: number = 100;
  static STATUS_RUNNING: number = 101;
  static STATUS_COMPLETE: number = 102;
  static STATUS_ERROR: number = 102;
}