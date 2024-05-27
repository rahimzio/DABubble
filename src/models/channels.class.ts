import { User } from "./user.class";

export class channel {
  id: string;
  name: string;
  description: string;
  usersInChannel: any[] = []
  threads: {};
  creator: string;

  constructor(obj?: any) {
    this.id = obj ? obj.id : '';
    this.name = obj ? obj.name : '';
    this.description = obj ? obj.description : '';
    this.usersInChannel = obj ? obj.usersInChannel : '';
    this.threads = obj ? obj.threads : '';
    this.creator = obj ? obj.creator : '';
  }

  public toJson() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      usersInChannel: this.usersInChannel,
      threads: this.threads,
      creator: this.creator
    }
  }
}
